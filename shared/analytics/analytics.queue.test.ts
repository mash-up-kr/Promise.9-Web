import { BATCH_MAX_RECORDS, QUEUE_MAX_RECORDS } from "./analytics.constants";
import { AnalyticsQueue } from "./analytics.queue";
import { createAnalyticsEvent } from "./analytics.schema";

function event(eventId: string) {
  return createAnalyticsEvent(
    { event_name: "test_requested" },
    { source: "web", environment: "production" },
    { eventId, occurredAt: "2026-10-21T00:00:00.000Z" },
  );
}

test("건수 상한이 차면 대기 이벤트를 보존하고 전송 후 다시 받는다", () => {
  const queue = new AnalyticsQueue();
  for (let i = 0; i < QUEUE_MAX_RECORDS; i++) queue.enqueue(event(`${i}`));
  expect(queue.enqueue(event("overflow"))).toBe(false);
  expect(queue.size).toBe(QUEUE_MAX_RECORDS);
  expect(queue.peekBatch()).toHaveLength(BATCH_MAX_RECORDS);
  expect(queue.peekBatch()[0]).toMatchObject({ event_id: "0" });
  queue.acknowledge(BATCH_MAX_RECORDS);
  expect(queue.enqueue(event("next"))).toBe(true);
});

test("전송 중 추가된 이벤트는 성공한 배치를 제거해도 남는다", () => {
  const queue = new AnalyticsQueue();
  queue.enqueue(event("first"));
  const batch = queue.peekBatch();
  queue.enqueue(event("second"));
  queue.acknowledge(batch.length);
  expect(queue.peekBatch()).toEqual([event("second")]);
});
