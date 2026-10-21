import { createAnalyticsEvent } from "./analytics.schema";

const context = {
  source: "web" as const,
  environment: "production" as const,
  anonymous_id: "anon-1",
  user_id: null,
  session_id: "session-1",
  os: "macos",
  browser: "chrome",
  client_version: "2026.10.18",
  utm: null,
};
const metadata = { eventId: "event-1", occurredAt: "2026-10-18T12:00:00.000Z" };

test("최상위 14개 필드만 전송하고 빈 커스텀 데이터에 문맥을 강제하지 않는다", () => {
  const event = createAnalyticsEvent(
    { event_name: "test_requested" },
    context,
    metadata,
  );
  expect(Object.keys(event).sort()).toEqual(
    [
      "schema_version",
      "event_id",
      "occurred_at",
      "event_name",
      "source",
      "environment",
      "anonymous_id",
      "user_id",
      "session_id",
      "os",
      "browser",
      "client_version",
      "utm",
      "custom_data",
    ].sort(),
  );
  expect(event.custom_data).toBe("{}");
  expect(event.utm).toBeNull();
});
test("서버 동기화용 접점 필드는 이벤트 UTM에 넣지 않는다", () => {
  const utm = {
    touch_id: "touch",
    captured_at: metadata.occurredAt,
    utm_source: "newsletter",
    utm_medium: null,
    utm_campaign: null,
    utm_content: null,
    utm_term: null,
  };
  const event = createAnalyticsEvent(
    { event_name: "test_completed" },
    { ...context, utm },
    metadata,
  );
  expect(event.utm).toEqual({
    utm_source: "newsletter",
    utm_medium: null,
    utm_campaign: null,
    utm_content: null,
    utm_term: null,
  });
});
test("실행 환경 값을 생략하면 기본값을 채운다", () => {
  expect(
    createAnalyticsEvent(
      { event_name: "test_identified" },
      {
        source: "app",
        environment: "production",
      },
      metadata,
    ),
  ).toMatchObject({
    os: "unknown",
    browser: null,
    client_version: null,
    anonymous_id: null,
    user_id: null,
    session_id: null,
  });
});

test("이벤트 생성은 내부 필드·무한값을 거절한다", () => {
  for (const input of [
    { event_name: "link_saved", custom_data: { link_id: Infinity } },
    { event_name: "link_save_requested", operation_id: "internal" },
  ]) {
    expect(() => createAnalyticsEvent(input, context, metadata)).toThrow();
  }
});
