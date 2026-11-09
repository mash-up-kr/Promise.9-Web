import type { ClientOptions } from "@shared/analytics/analytics.client";
import { toUtf8 } from "@smithy/util-utf8";
import { AnalyticsClient } from "./analytics.client";
import { createScreenTracking } from "./analytics.screen";

async function setup(source: "web" | "app" | "extension" = "web") {
  let id = 0;
  const send = jest
    .fn<Promise<void>, [Uint8Array[], AbortSignal]>()
    .mockResolvedValue(undefined);
  const analyticsOptions: ClientOptions = {
    source,
    environment: "production",
    newId: () => `id-${++id}`,
    send,
  };
  const client = new AnalyticsClient({
    ...analyticsOptions,
  });
  client.initialize("anon", analyticsOptions.newId());
  const collector = createScreenTracking(
    client,
    analyticsOptions.newId,
    jest.fn(),
  );
  return {
    client,
    send,
    events: collector,
  };
}

test("방문 ID 생성 실패는 화면에 전파하지 않고 이후 방문을 다시 수집한다", async () => {
  const { client, send } = await setup();
  const newId = jest
    .fn(() => "visit-id")
    .mockImplementationOnce(() => {
      throw new Error("randomUUID unavailable");
    });
  const onVisitChange = jest.fn();
  const collector = createScreenTracking(client, newId, onVisitChange);
  try {
    expect(() => collector.view("home", "/")).not.toThrow();
    expect(collector.screenViewId).toBeNull();
    expect(onVisitChange).not.toHaveBeenCalled();
    await client.flush();
    expect(send).not.toHaveBeenCalled();
    collector.view("home", "/");
    expect(collector.screenViewId).toBe("visit-id");
    expect(onVisitChange).toHaveBeenCalledWith("visit-id");
    collector.endScreenView();
    expect(onVisitChange).toHaveBeenLastCalledWith(null);
  } finally {
    client.dispose();
  }
});

describe("조회 구간이 끝날 때 기록하는 페이지뷰", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test("진입·재렌더링에는 기록하지 않고 경로 이동 시 이전 화면의 시간과 방문 ID를 기록한다", async () => {
    const { client, events: collector, send } = await setup();
    collector.view("link_detail", "/link/123");
    const firstVisitId = collector.screenViewId;
    await client.flush();
    expect(send).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(1200);
    collector.view("link_detail", "/link/123");
    expect(collector.screenViewId).toBe(firstVisitId);
    await jest.advanceTimersByTimeAsync(300);
    // 시스템 시각이 바뀌어도 체류 시간은 바뀌지 않는다.
    jest.setSystemTime(Date.now() + 60000);
    collector.view("link_detail", "/link/456");
    await client.flush();
    const events = send.mock.calls.flatMap(([records]) =>
      records.map((data) => JSON.parse(toUtf8(data))),
    );
    expect(events.map((event) => event.event_name)).toEqual(["page_view"]);
    expect(JSON.parse(events[0].custom_data)).toEqual({
      screen_name: "link_detail",
      screen_view_id: firstVisitId,
      path: "/link/123",
      duration_ms: 1500,
    });
    expect(collector.screenViewId).not.toBe(firstVisitId);
    client.dispose();
  });

  test.each([
    "web",
    "app",
    "extension",
  ] as const)("%s: 비활성·종료 중복 신호는 한 번만 기록하고 복귀 후 시간에는 숨긴 시간을 제외한다", async (source) => {
    const { client, events: collector, send } = await setup(source);
    collector.view("login", "/login");
    const firstVisitId = collector.screenViewId;
    await jest.advanceTimersByTimeAsync(2000);
    collector.handleActivityChange(false);
    collector.handleActivityChange(false);
    collector.endScreenView();
    expect(collector.screenViewId).toBeNull();
    // 마지막 화면도 주기 전송을 기다리지 않고 보낸다.
    expect(send).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(60000);
    collector.handleActivityChange(true);
    collector.handleActivityChange(true);
    const secondVisitId = collector.screenViewId;
    expect(secondVisitId).not.toBe(firstVisitId);
    expect(send).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(1000);
    collector.handleActivityChange(false);
    await client.flush();
    const events = send.mock.calls.flatMap(([records]) =>
      records.map((data) => JSON.parse(toUtf8(data))),
    );
    expect(events.map((event) => event.event_name)).toEqual([
      "page_view",
      "page_view",
    ]);
    expect(events.map((event) => JSON.parse(event.custom_data))).toEqual([
      {
        screen_name: "login",
        screen_view_id: firstVisitId,
        path: "/login",
        duration_ms: 2000,
      },
      {
        screen_name: "login",
        screen_view_id: secondVisitId,
        path: "/login",
        duration_ms: 1000,
      },
    ]);
    client.dispose();
  });

  test("숨겨진 상태의 화면 이동은 기록하지 않고 복귀한 화면부터 체류 시간을 잰다", async () => {
    const { client, events: collector, send } = await setup();
    collector.handleActivityChange(false);
    collector.view("login", "/login");
    await jest.advanceTimersByTimeAsync(60000);
    collector.view("home", "/");
    await client.flush();
    expect(send).not.toHaveBeenCalled();
    collector.handleActivityChange(true);
    await jest.advanceTimersByTimeAsync(500);
    collector.endScreenView();
    collector.endScreenView();
    await client.flush();
    const events = send.mock.calls.flatMap(([records]) =>
      records.map((data) => JSON.parse(toUtf8(data))),
    );
    expect(events.map((event) => event.event_name)).toEqual(["page_view"]);
    expect(JSON.parse(events[0].custom_data)).toEqual({
      screen_name: "home",
      screen_view_id: expect.any(String),
      path: "/",
      duration_ms: 500,
    });
    client.dispose();
  });
});
