import type { Link } from "@shared/types/link.types";

/**
 * 알림(리마인드)이 설정된 링크.
 *
 * 서버 `GET /links` 목록 응답에는 `reminderAt` 이 없어(LinkListItemDto 미포함) 목데이터로 채운다.
 */
export interface RemindLink extends Link {
  /** 알림 예정 시각 (ISO 8601) */
  reminderAt: string;
}

/** 저장된 링크에 붙은 태그 집계 — 태그별 링크 수. */
export interface HomeKeyword {
  name: string;
  linkCount: number;
}
