import type { Link } from "@shared/types/link.types";

/** 알림(리마인드)이 설정된 링크 — `GET /links?reminder=true` 응답 기반. */
export interface RemindLink extends Link {
  /** 알림 예정 시각 (ISO 8601) */
  reminderAt: string;
}

/** 자주 저장한 키워드 — 서버가 폴더·태그를 합쳐 준 추천 항목(`GET /recommendations`). */
export interface HomeKeyword {
  name: string;
  linkCount: number;
}
