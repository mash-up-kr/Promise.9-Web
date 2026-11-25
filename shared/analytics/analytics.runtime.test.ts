import { toUtf8 } from "@smithy/util-utf8";
import { createAnalytics } from "./analytics.runtime";

const send = jest
  .fn<Promise<void>, [Uint8Array[], AbortSignal]>()
  .mockResolvedValue(undefined);
beforeEach(() => {
  jest.clearAllMocks();
});
test("로그아웃 뒤 동일 UTM으로 재유입해도 새 익명 접점을 기록한다", async () => {
  let id = 0;
  const runtime = createAnalytics({
    send,
    source: "web",
    environment: "production",
    aws: { region: "region", identityPoolId: "pool", streamName: "stream" },
    storage: { get: async () => null, set: async () => {} },
    newId: () => `id-${++id}`,
  });
  await runtime.ready;
  runtime.capture({ utm_source: "newsletter" });
  runtime.identify("123");
  runtime.client.trackEvent({ event_name: "before_logout" });
  runtime.identify(null);
  expect(runtime.pendingTouch).toBeNull();
  runtime.capture({ utm_source: "newsletter" });
  runtime.client.trackEvent({ event_name: "test_requested" });
  await runtime.client.flush();
  const events = send.mock.calls[0][0].map((value) =>
    JSON.parse(toUtf8(value)),
  );
  expect(events.at(-1).anonymous_id).not.toBe(events[0].anonymous_id);
  expect(events.at(-1)).toMatchObject({
    utm: { utm_source: "newsletter" },
  });
  expect(events.at(-1)).not.toHaveProperty("user_id");
  runtime.client.dispose();
});

test("재실행 후 다른 계정이면 이전 계정의 익명 ID와 대기 접점을 분리한다", async () => {
  const values = new Map<string, string>();
  let id = 0;
  const options = {
    send,
    source: "web" as const,
    environment: "production" as const,
    aws: { region: "r", identityPoolId: "p", streamName: "s" },
    newId: () => `id-${++id}`,
    storage: {
      get: async (key: string) => values.get(key) ?? null,
      set: async (key: string, value: string) => {
        values.set(key, value);
      },
    },
  };
  const first = createAnalytics(options);
  await first.ready;
  first.identify("123");
  first.capture({ utm_source: "account-a" });
  first.client.dispose();
  for (let i = 0; i < 10; i++) await Promise.resolve();
  const next = createAnalytics(options);
  await next.ready;
  next.identify("456");
  expect(next.pendingTouch).toBeNull();
  next.client.trackEvent({ event_name: "test_requested" });
  await next.client.flush();
  const event = JSON.parse(toUtf8(send.mock.calls.at(-1)![0][0]));
  expect(event.anonymous_id).not.toBe("id-1");
  next.client.dispose();
});

test("저장소 준비 중에도 이벤트를 받아 발생 시각을 유지하고 복구한 ID만 보완한다", async () => {
  let release: (value: string | null) => void = () => {};
  const stored = new Promise<string | null>((resolve) => {
    release = resolve;
  });
  let id = 0;
  const runtime = createAnalytics({
    send,
    source: "web",
    environment: "production",
    aws: { region: "r", identityPoolId: "p", streamName: "s" },
    newId: () => `id-${++id}`,
    storage: {
      get: async (key) => (key.endsWith("anonymous_id") ? stored : null),
      set: async () => {},
    },
  });
  const before = Date.now();
  expect(runtime.client.trackEvent({ event_name: "test_requested" })).toBe(
    true,
  );
  expect(send).not.toHaveBeenCalled();
  release("restored-anon");
  await runtime.ready;
  runtime.identify("123");
  await runtime.client.flush();
  const event = JSON.parse(toUtf8(send.mock.calls[0][0][0]));
  expect(event).toMatchObject({ anonymous_id: "restored-anon" });
  expect(event).not.toHaveProperty("user_id");
  expect(Date.parse(event.occurred_at)).toBeGreaterThanOrEqual(before);
  runtime.client.dispose();
});

test("재실행 시 식별자·UTM만 복원하고 미전송 이벤트는 복원하지 않는다", async () => {
  const values = new Map<string, string>();
  let id = 0;
  let completeTouchWrite = () => {};
  const touchWritten = new Promise<void>((resolve) => {
    completeTouchWrite = resolve;
  });
  const options = {
    source: "web" as const,
    environment: "development" as const,
    aws: { region: "region", identityPoolId: "pool", streamName: "stream" },
    send,
    storage: {
      get: async (key: string) => values.get(key) ?? null,
      set: async (key: string, value: string) => {
        values.set(key, value);
        if (key === "promise9_analytics_attribution") completeTouchWrite();
      },
    },
    newId: () => `id-${++id}`,
  };
  const first = createAnalytics(options);
  await first.ready;
  first.capture({ utm_source: "newsletter" });
  first.client.trackEvent({ event_name: "test_requested" });
  // 식별 정보 저장은 끝났지만 이벤트는 메모리에만 남은 종료를 재현한다.
  await touchWritten;
  first.client.dispose();
  const next = createAnalytics(options);
  await next.ready;
  await next.client.flush();
  expect(send).not.toHaveBeenCalled();
  expect([...values.keys()].sort()).toEqual([
    "promise9_analytics_anonymous_id",
    "promise9_analytics_attribution",
  ]);
  next.client.trackEvent({
    event_name: "test_completed",
    custom_data: { link_id: 1 },
  });
  await next.client.flush();
  const events = send.mock.calls.flatMap(([records]) =>
    records.map((data) => JSON.parse(toUtf8(data))),
  );
  expect(events).toHaveLength(1);
  expect(events[0]).toMatchObject({
    event_name: "test_completed",
    anonymous_id: values.get("promise9_analytics_anonymous_id"),
    utm: { utm_source: "newsletter" },
  });
  next.client.dispose();
});

describe("수집 끄기 저장", () => {
  function memoryStorage(initial: Record<string, string> = {}) {
    const values = new Map(Object.entries(initial));
    return {
      values,
      storage: {
        get: async (key: string) => values.get(key) ?? null,
        set: async (key: string, value: string) => {
          values.set(key, value);
        },
      },
    };
  }
  const create = (storage: ReturnType<typeof memoryStorage>["storage"]) => {
    let id = 0;
    return createAnalytics({
      send,
      source: "app",
      environment: "production",
      aws: { region: "r", identityPoolId: "p", streamName: "s" },
      storage,
      newId: () => `id-${++id}`,
    });
  };

  test("끈 설정을 저장하고, 다시 실행하면 준비 전에 받은 첫 이벤트도 보내지 않는다", async () => {
    const { values, storage } = memoryStorage();
    const first = create(storage);
    await first.ready;
    first.setCollecting(false);
    await first.client.flush();
    first.client.dispose();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect([...values.values()]).toContain("false");

    const next = create(storage);
    next.client.trackEvent({ event_name: "in" });
    await next.ready;
    expect(next.client.isCollecting).toBe(false);
    await next.client.flush();
    expect(send).not.toHaveBeenCalled();
    next.client.dispose();
  });
  test("끄면 대기 중인 유입 접점을 지우고, 꺼진 동안 들어온 UTM은 저장·동기화하지 않는다", async () => {
    const { values, storage } = memoryStorage();
    const runtime = create(storage);
    await runtime.ready;
    const listener = jest.fn();
    runtime.subscribeTouch(listener);
    runtime.capture({ utm_source: "before" });
    runtime.setCollecting(false);
    expect(runtime.pendingTouch).toBeNull();
    listener.mockClear();
    runtime.capture({ utm_source: "while_off" });
    expect(runtime.pendingTouch).toBeNull();
    expect(listener).not.toHaveBeenCalled();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(values.get("promise9_analytics_attribution")).toBe("null");
    runtime.client.dispose();
  });
  test("꺼진 채 다시 실행하면 준비 전에 받은 UTM과 저장된 접점을 되살리지 않는다", async () => {
    const touch = {
      touch_id: "stored",
      captured_at: "2026-11-01T00:00:00.000Z",
      utm_source: "stored",
      utm_medium: null,
      utm_campaign: null,
      utm_content: null,
      utm_term: null,
    };
    const { storage } = memoryStorage({
      promise9_analytics_collecting: "false",
      promise9_analytics_attribution: JSON.stringify(touch),
    });
    const runtime = create(storage);
    runtime.capture({ utm_source: "before_ready" });
    await runtime.ready;
    expect(runtime.pendingTouch).toBeNull();
    runtime.client.dispose();
  });
  test("저장값을 읽기 전에 바꾼 설정은 나중에 읽은 저장값으로 덮지 않는다", async () => {
    const { storage } = memoryStorage({
      promise9_analytics_collecting: "false",
    });
    const runtime = create(storage);
    runtime.setCollecting(true);
    await runtime.ready;
    expect(runtime.client.isCollecting).toBe(true);
    runtime.client.dispose();
  });
});
