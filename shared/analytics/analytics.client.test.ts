import { toUtf8 } from "@smithy/util-utf8";
import { AnalyticsClient } from "./analytics.client";
import { BATCH_MAX_BYTES, RECORD_MAX_BYTES } from "./analytics.constants";

function setup() {
  let id = 0;
  const send = jest
    .fn<Promise<void>, [Uint8Array[], AbortSignal]>()
    .mockResolvedValue(undefined);
  const client = new AnalyticsClient({
    source: "web",
    environment: "production",
    newId: () => `id-${++id}`,
    send,
  });
  client.initialize("anon", "session");
  return { client, send };
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());
test("5초 또는 100개에 전송하고 요청 실패 시 배치 전체를 같은 ID로 재전송한다", async () => {
  const { client, send } = setup();
  send.mockRejectedValueOnce(new Error("offline"));
  client.trackEvent({ event_name: "test_requested" });
  await jest.advanceTimersByTimeAsync(4999);
  expect(send).not.toHaveBeenCalled();
  await jest.advanceTimersByTimeAsync(1);
  const first = send.mock.calls[0][0][0];
  expect(toUtf8(first).endsWith("\n")).toBe(true);
  await jest.advanceTimersByTimeAsync(5000);
  expect(send.mock.calls[1][0][0]).toEqual(first);
  for (let i = 0; i < 100; i++)
    client.trackEvent({ event_name: "test_requested" });
  await client.flush();
  expect(send.mock.calls[2][0]).toHaveLength(100);
  client.dispose();
});
test("flush는 실패한 큐를 바로 다시 보내고 진행 중 전송을 중복 실행하지 않는다", async () => {
  const { client, send } = setup();
  let complete = () => {};
  send.mockRejectedValueOnce(new Error("offline"));
  send.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        complete = resolve;
      }),
  );
  client.trackEvent({ event_name: "test_requested" });
  await client.flush();
  const pending = client.flush();
  expect(client.flush()).toBe(pending);
  expect(send).toHaveBeenCalledTimes(2);
  complete();
  await pending;
  client.dispose();
});
test("100건 전송이 실패해도 새 이벤트마다 요청하지 않고 다음 주기에 함께 보낸다", async () => {
  const { client, send } = setup();
  send.mockRejectedValueOnce(new Error("offline"));
  for (let i = 0; i < 100; i++)
    client.trackEvent({ event_name: "test_requested" });
  await client.flush();
  const failedRecords = send.mock.calls[0][0];
  for (let i = 0; i < 10; i++)
    client.trackEvent({ event_name: "test_requested" });
  expect(send).toHaveBeenCalledTimes(1);
  await jest.advanceTimersByTimeAsync(5000);
  expect(send).toHaveBeenCalledTimes(2);
  expect(send.mock.calls[1][0]).toHaveLength(110);
  expect(send.mock.calls[1][0].slice(0, 100)).toEqual(failedRecords);
  client.dispose();
});
test("식별자를 갱신해도 앞서 기록한 이벤트는 기존 사용자 정보를 유지한다", async () => {
  const { client, send } = setup();
  client.trackEvent({ event_name: "test_requested" });
  client.setIdentity("123");
  client.trackEvent({ event_name: "test_requested" });
  await client.flush();
  const events = send.mock.calls[0][0].map((data) => JSON.parse(toUtf8(data)));
  expect(events[0]).toMatchObject({ user_id: null, anonymous_id: "anon" });
  expect(events.at(-1)).toMatchObject({
    user_id: "123",
    anonymous_id: "anon",
  });
  client.setIdentity(null, "next-anon");
  client.trackEvent({ event_name: "test_requested" });
  await client.flush();
  expect(JSON.parse(toUtf8(send.mock.calls[1][0][0])).anonymous_id).toBe(
    "next-anon",
  );
  client.dispose();
});
test("SDK가 중단 신호에 응답하지 않아도 5초에 대기를 끝내고 큐를 재전송한다", async () => {
  const { client, send } = setup();
  send.mockImplementationOnce(() => new Promise(() => {}));
  client.trackEvent({ event_name: "test_requested" });
  const pending = client.flush();
  await jest.advanceTimersByTimeAsync(5000);
  await pending;
  expect(send.mock.calls[0][1].aborted).toBe(true);
  await client.flush();
  expect(send).toHaveBeenCalledTimes(2);
  expect(send.mock.calls[1][0]).toEqual(send.mock.calls[0][0]);
  client.dispose();
});

test("요청과 성공은 각각 trackEvent 호출 시점의 사용자 문맥을 사용한다", async () => {
  const { client, send } = setup();
  client.setIdentity("123");
  client.trackEvent({ event_name: "test_requested" });
  client.setIdentity("456");
  client.trackEvent({
    event_name: "test_completed",
    custom_data: { link_id: 1 },
  });
  await client.flush();
  const events = send.mock.calls.flatMap(([records]) =>
    records.map((data) => JSON.parse(toUtf8(data))),
  );
  expect(events.map((event) => event.user_id)).toEqual(["123", "456"]);
  expect(events[0].event_id).not.toBe(events[1].event_id);
  expect(events[1]).not.toHaveProperty("operation_id");
  client.dispose();
});

describe("메모리 큐 생명주기", () => {
  test.each([
    1000, 60000,
  ])("비활성 전송 실패는 보관하고 %i ms 뒤 복귀하면 바로 다시 보낸다", async (inactiveDuration) => {
    const { client, send } = setup();
    send.mockRejectedValueOnce(new Error("offline"));
    client.trackEvent({ event_name: "test_requested" });
    client.setActive(false);
    await client.flush();
    const original = send.mock.calls[0][0];
    expect(jest.getTimerCount()).toBe(0);
    await jest.advanceTimersByTimeAsync(inactiveDuration);
    expect(send).toHaveBeenCalledTimes(1);
    client.setActive(true);
    await client.flush();
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[1][0]).toEqual(original);
    client.dispose();
  });
});

test("initialize 전에는 큐에 보관하고 준비 후 식별자만 채워 전송한다", async () => {
  const send = jest
    .fn<Promise<void>, [Uint8Array[], AbortSignal]>()
    .mockResolvedValue(undefined);
  const client = new AnalyticsClient({
    source: "web",
    environment: "production",
    newId: () => "event-1",
    send,
  });
  const occurredAt = new Date().toISOString();
  client.trackEvent(
    {
      event_name: "test_requested",
      custom_data: { label: "저장" },
    },
    { flushSoon: true },
  );
  await client.flush();
  await jest.advanceTimersByTimeAsync(5000);
  expect(send).not.toHaveBeenCalled();
  client.initialize("restored-anon", "session");
  client.setIdentity("123");
  await client.flush();
  expect(JSON.parse(toUtf8(send.mock.calls[0][0][0]))).toMatchObject({
    event_id: "event-1",
    occurred_at: occurredAt,
    anonymous_id: "restored-anon",
    session_id: "session",
    user_id: null,
    custom_data: JSON.stringify({ label: "저장" }),
  });
  client.dispose();
});

test("큐에 넣은 뒤 custom_data와 UTM 원본을 수정해도 발생 당시 값을 보낸다", async () => {
  const { client, send } = setup();
  const customData = { nested: { label: "저장" } };
  const utm = {
    utm_source: "newsletter",
    utm_medium: null,
    utm_campaign: null,
    utm_content: null,
    utm_term: null,
  };
  client.setUtm(utm);
  client.trackEvent({ event_name: "test_requested", custom_data: customData });
  customData.nested.label = "변경";
  utm.utm_source = "other";
  await client.flush();
  expect(JSON.parse(toUtf8(send.mock.calls[0][0][0]))).toMatchObject({
    utm: { utm_source: "newsletter" },
    custom_data: JSON.stringify({ nested: { label: "저장" } }),
  });
  client.dispose();
});

test("전송할 수 없는 큰 이벤트를 버리고 나머지는 요청 용량 안에서 나눠 보낸다", async () => {
  const { client, send } = setup();
  expect(
    client.trackEvent({
      event_name: "too_large",
      custom_data: { value: "가".repeat(RECORD_MAX_BYTES) },
    }),
  ).toBe(true);
  for (let i = 0; i < 4; i++) {
    client.trackEvent({
      event_name: "test_requested",
      custom_data: { value: "가".repeat(300000), index: i },
    });
  }
  await client.flush();
  expect(send).toHaveBeenCalledTimes(2);
  for (const [records] of send.mock.calls) {
    expect(
      records.reduce((total, data) => total + data.byteLength, 0),
    ).toBeLessThanOrEqual(BATCH_MAX_BYTES);
  }
  expect(
    send.mock.calls.flatMap(([records]) =>
      records.map(
        (data) => JSON.parse(JSON.parse(toUtf8(data)).custom_data).index,
      ),
    ),
  ).toEqual([0, 1, 2, 3]);
  await client.flush();
  expect(send).toHaveBeenCalledTimes(2);
  client.dispose();
});

test("잘못된 이벤트는 호출자에게 예외를 던지지 않고 거절한다", async () => {
  const { client, send } = setup();
  expect(
    client.trackEvent({
      event_name: "test_requested",
      custom_data: { value: Infinity },
    }),
  ).toBe(false);
  await client.flush();
  expect(send).not.toHaveBeenCalled();
  client.dispose();
});

test("종료하면 진행 중 전송과 재시도를 멈춘다", async () => {
  const { client, send } = setup();
  send.mockImplementationOnce(() => new Promise(() => {}));
  client.trackEvent({ event_name: "test_requested" }, { flushSoon: true });
  const pending = client.flush();
  client.dispose();
  await expect(pending).resolves.toBeUndefined();
  expect(send.mock.calls[0][1].aborted).toBe(true);
  expect(client.trackEvent({ event_name: "test_requested" })).toBe(false);
  expect(jest.getTimerCount()).toBe(0);
});
