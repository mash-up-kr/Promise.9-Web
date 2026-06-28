/**
 * 저장된 링크 도메인 타입 (link-detail 화면 기준).
 *
 * 백엔드 API 스펙이 아직 확정되지 않아 필드가 변경될 수 있다.
 * 필드 추가/삭제 시 이 타입 하나만 수정하면 되도록 의도적으로 단일 flat 구조로 유지한다.
 */
export type Link = {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  source: string;
  /** ISO 8601 문자열 */
  savedAt: string;
  folder?: string;
  tags: string[];
  memo: string;
  aiSummary: string;
  isFavorite: boolean;
};
