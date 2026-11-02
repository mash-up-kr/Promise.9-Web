import type { TrackDeliveryOptions } from "./analytics.client";

export const ANALYTICS_EVENTS = {
  /** 서비스 실행당 한 번 기록하는 진입. 웹 새로고침은 RELOAD로 구분한다. */
  IN: "in",
  /** 웹 새로고침으로 진입했을 때 IN 대신 기록한다. */
  RELOAD: "reload",
  /** 화면 이동·숨김·백그라운드 전환으로 조회 구간이 끝날 때 경로와 체류 시간을 기록한다. */
  PAGE_VIEW: "page_view",
} as const;

// JSON Record 입력에 할당할 수 있도록 확장 가능한 interface 대신 객체 별칭을 사용한다.
type ScreenData = {
  screen_name: string | null;
  screen_view_id: string | null;
};
/** 이벤트별 속성은 타입으로만 확인한다. JSON 검사는 공통 전송 코어에서 한 번 수행한다. */
interface EventData {
  [ANALYTICS_EVENTS.IN]: undefined;
  [ANALYTICS_EVENTS.RELOAD]: undefined;
  [ANALYTICS_EVENTS.PAGE_VIEW]: ScreenData & {
    path: string;
    duration_ms: number;
  };
}
export type AnalyticsEventName = keyof EventData;
export type AnalyticsInput = {
  [Name in AnalyticsEventName]: {
    event_name: Name;
  } & (EventData[Name] extends undefined
    ? { custom_data?: Record<string, never> }
    : { custom_data: EventData[Name] });
}[AnalyticsEventName];

export type { TrackDeliveryOptions } from "./analytics.client";
export type TrackEvent = (
  input: AnalyticsInput,
  options?: TrackDeliveryOptions,
) => boolean;
