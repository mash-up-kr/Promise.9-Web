import type { HomeKeyword, RemindLink } from "./home.types";

// 서버 미제공 구간의 목데이터 — 내용은 Figma 시안 예시를 따른다.
// 리마인드는 `GET /links` 목록 응답에 reminderAt 이 없고, 키워드는 태그 집계 API 가 아직 없다.

export const HOME_REMIND_LINKS: RemindLink[] = [
  {
    linkId: 101,
    title: "무조건 행복해지는 인생 치트키 사우나",
    source: "example.com",
    representativeTag: null,
    thumbnailUrl: null,
    savedAt: "2026-08-01T00:00:00.000Z",
    reminderAt: "2026-08-10T00:00:00.000Z",
  },
  {
    linkId: 102,
    title: "Obsidian CEO가 직접 만든 옵시디언 스킬",
    source: "example.com",
    representativeTag: null,
    thumbnailUrl: null,
    savedAt: "2026-08-03T00:00:00.000Z",
    reminderAt: "2026-08-22T00:00:00.000Z",
  },
  {
    linkId: 103,
    title: "신입 디자이너가 알아야 할 실험 설계 팁",
    source: "example.com",
    representativeTag: null,
    thumbnailUrl: null,
    savedAt: "2026-08-05T00:00:00.000Z",
    reminderAt: "2026-09-02T00:00:00.000Z",
  },
];

export const HOME_KEYWORDS: HomeKeyword[] = [
  { name: "운동", linkCount: 12 },
  { name: "자기소개서", linkCount: 11 },
  { name: "프론트엔드", linkCount: 10 },
  { name: "디자인", linkCount: 9 },
  { name: "개발", linkCount: 8 },
  { name: "컨퍼런스", linkCount: 7 },
  { name: "이력서", linkCount: 6 },
  { name: "여행", linkCount: 5 },
  { name: "맛집", linkCount: 5 },
  { name: "커리어", linkCount: 4 },
  { name: "회고", linkCount: 4 },
  { name: "사이드프로젝트", linkCount: 3 },
];
