import { createAnalytics } from "@shared/analytics/analytics.runtime";
import { apiClient } from "@shared/api";
import { fetchUserAttribution } from "@shared/entities/user/user.attribution.api";
import { toUtf8 } from "@smithy/util-utf8";
import { bindAnalyticsIdentity } from "./identity";

jest.mock("@shared/api", () => ({
  apiClient: { get: jest.fn() },
}));
beforeEach(() => jest.clearAllMocks());

const tick = async () => {
  for (let i = 0; i < 15; i++) await Promise.resolve();
};
const touch = {
  touch_id: "account-touch",
  captured_at: "2026-10-14T00:00:00.000Z",
  utm_source: "newsletter",
  utm_medium: null,
  utm_campaign: null,
  utm_content: null,
  utm_term: null,
};
const attribution = {
  userId: 123,
  utm: touch,
};
async function setup() {
  let id = 0;
  let token: string | null = "token";
  let notify = () => {};
  const send = jest
    .fn<Promise<void>, [Uint8Array[], AbortSignal]>()
    .mockResolvedValue(undefined);
  const runtime = createAnalytics({
    send,
    source: "web",
    environment: "production",
    aws: { region: "region", identityPoolId: "pool", streamName: "stream" },
    storage: { get: async () => null, set: async () => {} },
    newId: () => `id-${++id}`,
  });
  await runtime.ready;
  jest.mocked(apiClient.get).mockResolvedValue({
    data: { success: true, data: attribution },
  });
  const source = {
    getToken: async () => token,
    loadAttribution: jest.fn(fetchUserAttribution),
    saveTouch: jest.fn().mockResolvedValue(attribution),
    subscribe: (listener: () => void) => {
      notify = listener;
      return jest.fn();
    },
  };
  const events = async () => {
    await runtime.client.flush();
    return send.mock.calls.flatMap(([records]) =>
      records.map((record) => JSON.parse(toUtf8(record))),
    );
  };
  return {
    runtime,
    source,
    events,
    changeToken: (value: string | null) => {
      token = value;
      notify();
    },
  };
}
test("로그인 전후 이벤트는 같은 세션을 유지하고 이후 이벤트에 회원·서버 UTM을 채운다", async () => {
  const { runtime, source, events } = await setup();
  runtime.capture({ utm_source: "local" });
  runtime.client.trackEvent({ event_name: "test_event" });
  const stop = bindAnalyticsIdentity(runtime, source);
  await tick();
  expect(apiClient.get).toHaveBeenCalledWith("/users/me/attribution", {
    signal: expect.any(AbortSignal),
  });
  expect(source.saveTouch).toHaveBeenCalledWith(
    expect.objectContaining({ utm_source: "local" }),
    expect.any(AbortSignal),
  );
  runtime.client.trackEvent({ event_name: "test_event" });
  const data = await events();
  expect(data).toHaveLength(2);
  expect(data[0]).toMatchObject({
    user_id: null,
    session_id: expect.any(String),
    utm: { utm_source: "local" },
  });
  expect(data[1]).toMatchObject({
    user_id: "123",
    session_id: data[0].session_id,
    utm: {
      utm_source: "newsletter",
    },
  });
  expect(source.saveTouch.mock.calls[0][0]).not.toHaveProperty("model");
  expect(source.saveTouch.mock.calls[0][0]).not.toHaveProperty("scope");
  expect(runtime.pendingTouch).toBeNull();
  stop();
  runtime.client.dispose();
});
test("직접 방문은 PATCH 없이 계정의 last를 사용하고 로그인 상태의 새 UTM은 동기화한다", async () => {
  const { runtime, source, events } = await setup();
  const stop = bindAnalyticsIdentity(runtime, source);
  await tick();
  expect(source.saveTouch).not.toHaveBeenCalled();
  runtime.capture({ utm_source: "new-campaign" });
  await tick();
  expect(source.saveTouch).toHaveBeenCalledWith(
    expect.objectContaining({ utm_source: "new-campaign" }),
    expect.any(AbortSignal),
  );
  runtime.client.trackEvent({ event_name: "test_event" });
  expect((await events()).at(-1).utm.utm_source).toBe("newsletter");
  stop();
  runtime.client.dispose();
});
test("로그아웃 뒤 늦게 도착한 회원·UTM 응답을 버린다", async () => {
  const { runtime, source, changeToken, events } = await setup();
  let resolve = (_value: typeof attribution) => {};
  source.loadAttribution.mockImplementationOnce(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  const stop = bindAnalyticsIdentity(runtime, source);
  await tick();
  changeToken(null);
  await tick();
  resolve(attribution);
  await tick();
  runtime.client.trackEvent({ event_name: "test_event" });
  expect((await events()).at(-1)).toMatchObject({
    user_id: null,
    utm: null,
  });
  stop();
  runtime.client.dispose();
});
test("계정 전환 후 이전 계정 PATCH 응답이 새 계정 UTM을 덮지 않는다", async () => {
  const { runtime, source, changeToken, events } = await setup();
  runtime.capture({ utm_source: "local" });
  let resolve = (_value: typeof attribution) => {};
  source.saveTouch.mockImplementationOnce(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  const stop = bindAnalyticsIdentity(runtime, source);
  await tick();
  source.loadAttribution.mockResolvedValue({
    userId: 456,
    utm: null,
  });
  changeToken("other");
  await tick();
  resolve(attribution);
  await tick();
  runtime.client.trackEvent({ event_name: "test_event" });
  expect((await events()).at(-1)).toMatchObject({
    user_id: "456",
    utm: null,
  });
  expect(source.saveTouch).toHaveBeenCalledTimes(1);
  stop();
  runtime.client.dispose();
});

test("PATCH를 기다리는 동안에도 더 최근에 수집한 UTM을 현재 이벤트에 남긴다", async () => {
  const { runtime, source, events } = await setup();
  runtime.capture({ utm_source: "new-campaign" });
  source.saveTouch.mockImplementationOnce(() => new Promise(() => {}));
  const stop = bindAnalyticsIdentity(runtime, source);
  await tick();
  runtime.client.trackEvent({ event_name: "test_event" });
  const data = await events();
  expect(data.at(-1)).toMatchObject({
    user_id: "123",
    utm: { utm_source: "new-campaign" },
  });
  stop();
  runtime.client.dispose();
});
test("같은 로그인으로 앱 복귀·탭 전환 알림이 와도 회원 정보를 다시 묻지 않는다", async () => {
  const { runtime, source, changeToken } = await setup();
  const stop = bindAnalyticsIdentity(runtime, source);
  await tick();
  changeToken("token");
  await tick();
  expect(source.loadAttribution).toHaveBeenCalledTimes(1);
  stop();
  runtime.client.dispose();
});
test("회원 재확인이 실패해도 확인 중·실패 뒤 이벤트에 이전 회원 ID를 유지한다", async () => {
  const { runtime, source, changeToken, events } = await setup();
  const stop = bindAnalyticsIdentity(runtime, source);
  await tick();
  let reject = (_error: Error) => {};
  source.loadAttribution.mockImplementationOnce(
    () =>
      new Promise((_, r) => {
        reject = r;
      }),
  );
  changeToken("rotated");
  await tick();
  runtime.client.trackEvent({ event_name: "during_check" });
  reject(new Error("offline"));
  await tick();
  runtime.client.trackEvent({ event_name: "after_failure" });
  const data = await events();
  expect(data.map((event) => event.user_id)).toEqual(["123", "123"]);
  stop();
  runtime.client.dispose();
});
test("확인 중 토큰이 재발급돼도 요청을 다시 시작하지 않고, 실패하면 다음 알림까지 묻지 않는다", async () => {
  const { runtime, source, changeToken } = await setup();
  source.loadAttribution.mockImplementation(async () => {
    changeToken(`rotated-${source.loadAttribution.mock.calls.length}`);
    throw new Error("401");
  });
  const stop = bindAnalyticsIdentity(runtime, source);
  for (let i = 0; i < 10; i++) await tick();
  expect(source.loadAttribution).toHaveBeenCalledTimes(1);
  stop();
  runtime.client.dispose();
});
test("새 UTM PATCH 가 재발급 뒤에도 401 이면 다시 묻지 않고 다음 알림을 기다린다", async () => {
  const { runtime, source, changeToken } = await setup();
  runtime.capture({ utm_source: "local" });
  source.saveTouch.mockImplementation(async () => {
    // 고치기 전 코드가 무한 반복해도 테스트가 끝나도록 20번에서 멈춘다.
    if (source.saveTouch.mock.calls.length < 20)
      changeToken(`rotated-${source.saveTouch.mock.calls.length}`);
    throw new Error("401");
  });
  const stop = bindAnalyticsIdentity(runtime, source);
  for (let i = 0; i < 10; i++) await tick();
  expect(source.saveTouch).toHaveBeenCalledTimes(1);
  stop();
  runtime.client.dispose();
});
test("새 UTM 저장을 기다리는 동안 들어온 다른 캠페인을 이전 저장 응답으로 덮지 않는다", async () => {
  const { runtime, source, events } = await setup();
  runtime.capture({ utm_source: "first" });
  let resolve = (_value: typeof attribution) => {};
  source.saveTouch.mockImplementationOnce(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  const stop = bindAnalyticsIdentity(runtime, source);
  await tick();
  const firstTouch = source.saveTouch.mock.calls[0][0];
  source.loadAttribution.mockImplementation(() => new Promise(() => {}));
  runtime.capture({ utm_source: "second" });
  await tick();
  resolve({ userId: 123, utm: firstTouch });
  await tick();
  runtime.client.trackEvent({ event_name: "test_event" });
  expect((await events()).at(-1).utm.utm_source).toBe("second");
  stop();
  runtime.client.dispose();
});
test("확인이 실패로 끝난 뒤에 토큰 읽기가 끝난 재발급 알림도 다시 묻지 않는다", async () => {
  const { runtime, source, changeToken } = await setup();
  const readToken = source.getToken;
  source.getToken = async () => {
    for (let i = 0; i < 20; i++) await Promise.resolve();
    return readToken();
  };
  source.loadAttribution.mockImplementation(async () => {
    // 고치기 전 코드가 무한 반복해도 테스트가 끝나도록 20번에서 멈춘다.
    if (source.loadAttribution.mock.calls.length < 20)
      changeToken(`rotated-${source.loadAttribution.mock.calls.length}`);
    throw new Error("401");
  });
  const stop = bindAnalyticsIdentity(runtime, source);
  for (let i = 0; i < 40; i++) await tick();
  expect(source.loadAttribution).toHaveBeenCalledTimes(1);
  stop();
  runtime.client.dispose();
});
