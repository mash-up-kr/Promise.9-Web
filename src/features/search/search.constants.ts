/**
 * 타이핑이 멈춘 뒤 자동 검색까지의 대기시간.
 * Google RAIL 은 디바운스 수치를 직접 제시하지 않는다 — 평균 타이핑 키 간격(~100–300ms)을
 * 상회해 단어·IME 조합 중간 발화를 막으면서, 대기+응답이 RAIL 의 연속성 구간(100–1000ms)에
 * 들어오는 값으로 정했다.
 */
export const SEARCH_DEBOUNCE_MS = 300;

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
