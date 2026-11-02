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
