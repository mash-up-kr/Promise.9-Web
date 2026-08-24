/** 검색 시안 정책 수치 — 노출 조건·최대 개수. */
export const SEARCH_POLICY = {
  /** 최근 검색어 */
  recentKeywords: {
    /** 최대 저장 개수. 개별 삭제 없음·만료 없음(시안 정책). */
    max: 10,
  },
  /** 최근 본 링크 */
  recentLinks: {
    /** 최대 노출 개수 (조회 최신순) */
    max: 10,
  },
} as const;
