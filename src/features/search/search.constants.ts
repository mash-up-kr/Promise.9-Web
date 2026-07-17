/**
 * 타이핑이 멈춘 뒤 자동 검색까지의 대기시간.
 * Google RAIL 은 디바운스 수치를 직접 제시하지 않는다 — 평균 타이핑 키 간격(~100–300ms)을
 * 상회해 단어·IME 조합 중간 발화를 막으면서, 대기+응답이 RAIL 의 연속성 구간(100–1000ms)에
 * 들어오는 값으로 정했다.
 */
export const SEARCH_DEBOUNCE_MS = 300;

/** 링크 분류 카테고리 — Figma 시안의 고정 목록. 백엔드 스펙 확정 시 대체한다. */
export const CATEGORIES = [
  "AI",
  "개발",
  "디자인",
  "학습",
  "정보",
  "커리어",
  "라이프",
  "장소",
  "문화",
  "쇼핑",
  "기타",
] as const;

export type Category = (typeof CATEGORIES)[number];

/** 카테고리 둘러보기 탭 목록 — '전체' 탭이 맨 앞에 온다. */
export const CATEGORY_TABS = ["전체", ...CATEGORIES] as const;

export type CategoryTab = (typeof CATEGORY_TABS)[number];
