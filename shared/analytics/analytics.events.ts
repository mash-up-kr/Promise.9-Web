import type { TrackDeliveryOptions } from "./analytics.client";
import type { AnalyticsEventInput } from "./analytics.schema";

export const ANALYTICS_EVENTS = {
  /** 서비스 실행당 한 번 기록하는 진입. 웹 새로고침은 RELOAD로 구분한다. */
  IN: "in",
  /** 웹 새로고침으로 진입했을 때 IN 대신 기록한다. */
  RELOAD: "reload",
  /** 화면 이동·숨김·백그라운드 전환으로 조회 구간이 끝날 때 경로와 체류 시간을 기록한다. */
  PAGE_VIEW: "page_view",
  /** 추적을 활성화한 컴포넌트의 클릭·탭. label과 호출부의 custom_data를 포함한다. */
  COMPONENT_CLICKED: "component_clicked",
  /** 추적 대상이 노출 기준을 충족했을 때 기록한다. 반복 관찰 제어는 각 수집 훅이 맡는다. */
  COMPONENT_IMPRESSION: "component_impression",
  /** 링크 생성 성공 시 link_id와 선택적 entry_point를 기록한다. */
  LINK_SAVED: "link_saved",
  /** 소셜 인증과 토큰 저장이 완료되면 provider를 기록한다. */
  LOGIN_COMPLETED: "login_completed",
  /** 로그인 완료 시 신규 회원(isNewUser)이면 provider를 추가로 기록한다. */
  SIGNUP_COMPLETED: "signup_completed",
} as const;

export type ComponentCustomData = NonNullable<
  AnalyticsEventInput["custom_data"]
>;

// JSON Record 입력에 할당할 수 있도록 확장 가능한 interface 대신 객체 별칭을 사용한다.
type ScreenData = {
  screen_name: string | null;
  screen_view_id: string | null;
};
type ComponentData = ScreenData &
  ComponentCustomData & {
    label: string;
  };

/** 이벤트별 속성은 타입으로만 확인한다. JSON 검사는 공통 전송 코어에서 한 번 수행한다. */
interface EventData {
  [ANALYTICS_EVENTS.IN]: undefined;
  [ANALYTICS_EVENTS.RELOAD]: undefined;
  [ANALYTICS_EVENTS.PAGE_VIEW]: ScreenData & {
    path: string;
    duration_ms: number;
  };
  [ANALYTICS_EVENTS.COMPONENT_CLICKED]: ComponentData;
  [ANALYTICS_EVENTS.COMPONENT_IMPRESSION]: ComponentData;
  [ANALYTICS_EVENTS.LINK_SAVED]: { link_id: number; entry_point?: string };
  [ANALYTICS_EVENTS.LOGIN_COMPLETED]: { provider: string };
  [ANALYTICS_EVENTS.SIGNUP_COMPLETED]: { provider: string };
}
export type AnalyticsEventName = keyof EventData;
export type AnalyticsInput = {
  [Name in AnalyticsEventName]: {
    event_name: Name;
  } & (EventData[Name] extends undefined
    ? { custom_data?: Record<string, never> }
    : { custom_data: EventData[Name] });
}[AnalyticsEventName];

export interface TrackOptions {
  disabled?: boolean;
  custom_data?: ComponentCustomData;
}
export type { TrackDeliveryOptions } from "./analytics.client";
export type TrackEvent = (
  input: AnalyticsInput,
  options?: TrackDeliveryOptions,
) => boolean;
