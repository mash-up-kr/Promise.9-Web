import { z } from "zod";

/** 공통 입력 계약. 이벤트별 이름·속성은 수집 계층의 타입으로 관리한다. */
export const analyticsEventInputSchema = z.strictObject({
  event_name: z.string().min(1),
  custom_data: z.record(z.string(), z.json()).default({}),
});
export type AnalyticsEventInput = z.input<typeof analyticsEventInputSchema>;

/** 이벤트에는 유입 정보만 담는다. 접점 ID·수집 시각은 서버 동기화 계층에서 관리한다. */
export interface AnalyticsUtm {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
}

/** 코어가 관리하는 내부 문맥. 외부 UTM은 API·저장소에서 읽을 때 검증한다. */
export interface AnalyticsContext {
  source: "web" | "app" | "extension";
  environment: "development" | "production";
  anonymous_id?: string | null;
  user_id?: string | null;
  session_id?: string | null;
  os?: string;
  browser?: string | null;
  client_version?: string | null;
  utm?: AnalyticsUtm | null;
}

export interface EventMetadata {
  eventId: string;
  occurredAt: string;
}

/** 큐에 보관하는 이벤트. 공통 문맥과 custom_data는 발생 시점의 값이다. */
export interface AnalyticsEvent extends Required<AnalyticsContext> {
  schema_version: 1;
  event_id: string;
  occurred_at: string;
  event_name: string;
  custom_data: string;
}

/**
 * 발생 시점의 문맥을 최상위 14개 필드로 고정한다.
 * custom_data는 전송 계약에 맞는 JSON 문자열로 복사해 이후 원본 수정과 분리한다.
 */
export function createAnalyticsEvent(
  input: AnalyticsEventInput,
  context: AnalyticsContext,
  metadata: EventMetadata,
): AnalyticsEvent {
  const { custom_data, event_name } = analyticsEventInputSchema.parse(input);
  return {
    schema_version: 1,
    event_id: metadata.eventId,
    occurred_at: metadata.occurredAt,
    event_name,
    source: context.source,
    environment: context.environment,
    anonymous_id: context.anonymous_id ?? null,
    user_id: context.user_id ?? null,
    session_id: context.session_id ?? null,
    os: context.os ?? "unknown",
    browser: context.browser ?? null,
    client_version: context.client_version ?? null,
    // 서버 동기화용 touch_id·captured_at은 전송하지 않는다.
    utm: context.utm
      ? {
          utm_source: context.utm.utm_source,
          utm_medium: context.utm.utm_medium,
          utm_campaign: context.utm.utm_campaign,
          utm_content: context.utm.utm_content,
          utm_term: context.utm.utm_term,
        }
      : null,
    custom_data: JSON.stringify(custom_data),
  };
}
