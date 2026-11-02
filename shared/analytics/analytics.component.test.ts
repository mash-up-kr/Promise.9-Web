import type { ClientOptions } from "@shared/analytics/analytics.client";
import { createScreenTracking } from "@shared/analytics/analytics.screen";
import { toUtf8 } from "@smithy/util-utf8";
import { AnalyticsClient } from "./analytics.client";
import { trackComponentEvent } from "./analytics.component";

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
    events: Object.assign(collector, {
      click: (
        label: string,
        data?: import("./analytics.events").ComponentCustomData,
      ) =>
        trackComponentEvent(
          (input) => client.trackEvent(input),
          collector,
          "component_clicked",
          label,
          data,
        ),
      impression: (
        label: string,
        data?: import("./analytics.events").ComponentCustomData,
      ) =>
        trackComponentEvent(
          (input) => client.trackEvent(input),
          collector,
          "component_impression",
          label,
          data,
        ),
    }),
  };
}

describe("클릭·노출 이벤트 속성", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());
  test("같은 라벨의 노출도 호출부별 커스텀 데이터를 모두 기록한다", async () => {
    const { client, events: collector, send } = await setup();
    collector.view("home", "home");
    collector.impression("home.card", { link_id: 1 });
    collector.impression("home.card", { link_id: 2 });
    await client.flush();
    const events = send.mock.calls[0][0].map((data) =>
      JSON.parse(toUtf8(data)),
    );
    const impressions = events.filter(
      (event) => event.event_name === "component_impression",
    );
    expect(impressions.map((event) => JSON.parse(event.custom_data))).toEqual([
      expect.objectContaining({ label: "home.card", link_id: 1 }),
      expect.objectContaining({ label: "home.card", link_id: 2 }),
    ]);
    client.dispose();
  });
});

test("클릭·노출은 커스텀 데이터를 보존하고 수집한 화면 정보와 라벨을 우선한다", async () => {
  const { client, events: collector, send } = await setup();
  collector.view("home", "/");
  const data = {
    link_id: 42,
    position: 2,
    details: { tags: ["news", null, true], score: 0.5 },
    label: "spoofed",
    screen_name: "spoofed",
    screen_view_id: "spoofed",
    viewport_width: 999,
    max_scroll_depth_percent: 100,
  };
  expect(collector.click("home.card", data)).toBe(true);
  expect(collector.impression("home.card", data)).toBe(true);
  data.details.tags[0] = "changed";
  await client.flush();
  const events = send.mock.calls
    .flatMap(([records]) => records.map((value) => JSON.parse(toUtf8(value))))
    .filter((event) => event.event_name.startsWith("component_"));
  expect(events).toHaveLength(2);
  for (const event of events) {
    expect(JSON.parse(event.custom_data)).toEqual({
      link_id: 42,
      position: 2,
      details: { tags: ["news", null, true], score: 0.5 },
      label: "home.card",
      screen_name: "home",
      screen_view_id: collector.screenViewId,
      viewport_width: 999,
      max_scroll_depth_percent: 100,
    });
  }
  client.dispose();
});

test("JSON이 아닌 커스텀 속성은 서비스에 예외를 던지지 않고 거절한다", async () => {
  const { client, events: collector, send } = await setup();
  const cyclic: Record<string, unknown> = {};
  cyclic.self = cyclic;
  for (const data of [
    { value: undefined },
    { value: () => {} },
    { value: Infinity },
    { value: BigInt(1) },
    cyclic,
  ]) {
    // @ts-expect-error 외부 입력의 런타임 검증
    expect(collector.click("test", data)).toBe(false);
  }
  await client.flush();
  expect(send).not.toHaveBeenCalled();
  client.dispose();
});
