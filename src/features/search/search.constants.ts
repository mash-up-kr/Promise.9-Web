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
