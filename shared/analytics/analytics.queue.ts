import { BATCH_MAX_RECORDS, QUEUE_MAX_RECORDS } from "./analytics.constants";
import type { AnalyticsEvent } from "./analytics.schema";

/** 이벤트를 발생 순서대로 보관한다. 전송 형식 변환은 클라이언트가 담당한다. */
export class AnalyticsQueue {
  private readonly events: AnalyticsEvent[] = [];

  get size(): number {
    return this.events.length;
  }

  enqueue(event: AnalyticsEvent): boolean {
    // 전송이 오래 실패해도 무한히 쌓이지 않도록 새 이벤트 수락을 제한한다.
    if (this.size >= QUEUE_MAX_RECORDS) return false;
    this.events.push(event);
    return true;
  }

  fillMissingIdentity(anonymousId: string, sessionId: string): void {
    for (const event of this.events) {
      event.anonymous_id ??= anonymousId;
      event.session_id ??= sessionId;
    }
  }

  peekBatch(): AnalyticsEvent[] {
    return this.events.slice(0, BATCH_MAX_RECORDS);
  }

  // 전송에 성공했거나 크기 초과로 제외한 앞쪽 이벤트를 제거한다.
  // 전송 중 뒤에 추가된 이벤트는 그대로 둔다.
  acknowledge(processedEventCount: number): void {
    this.events.splice(0, processedEventCount);
  }
}
