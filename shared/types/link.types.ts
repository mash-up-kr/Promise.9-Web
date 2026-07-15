/** 태그 생성 주체 — 사용자 직접 추가 / 규칙 기반 / AI 생성 */
export type LinkTagSourceType = "user" | "rule" | "ai";

/** 링크 태그 — 서버 docs/api/tag.md LinkTagResponseDto 기반 (식별자는 id 로 통일) */
export interface LinkTag {
  id: number;
  name: string;
  sourceType: LinkTagSourceType;
  sortOrder: number | null;
}

/**
 * 링크 목록 아이템 — 서버 docs/api/link.md GET /links 응답 기반.
 * 식별자는 id 로 통일한다 (서버는 linkId — API 연동 시 api 레이어에서 변환하거나 서버와 조율).
 * representativeTag 는 대표 태그 선정 정책 구현 전까지 서버가 항상 null 을 반환한다.
 */
export interface Link {
  id: number;
  title: string;
  source: string;
  representativeTag: LinkTag | null;
  thumbnailUrl: string | null;
  savedAt: string;
}
