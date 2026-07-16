import type { Link, LinkTag } from "@shared/types/link.types";

// API 연동 전 검색 화면 구성용 mock. 내용은 Figma 시안 예시를 따른다.
const DAY_MS = 24 * 60 * 60 * 1000;
const daysAgo = (days: number) =>
  new Date(Date.now() - days * DAY_MS).toISOString();

function tag(tagId: number, name: string): LinkTag {
  return { tagId, name, sourceType: "ai", sortOrder: null };
}

export const CATEGORY_LINKS: Link[] = [
  {
    linkId: 21,
    title: "무조건 행복해지는 인생 치트키 사우나",
    source: "example.com",
    representativeTag: tag(1, "장소"),
    thumbnailUrl: null,
    savedAt: daysAgo(0),
  },
  {
    linkId: 22,
    title: "피그마 파일 PSD로 변환하는 방법",
    source: "example.com",
    representativeTag: tag(2, "디자인"),
    thumbnailUrl: null,
    savedAt: daysAgo(3),
  },
  {
    linkId: 23,
    title: "누구나 60점을 만드는 시대에, 프로덕트 디자이너가 던져야 할 질문",
    source: "example.com",
    representativeTag: tag(2, "디자인"),
    thumbnailUrl: null,
    savedAt: daysAgo(7),
  },
  {
    linkId: 24,
    title: "오늘의집은 어떻게 200명의 리서처를 만들었을까?",
    source: "example.com",
    representativeTag: tag(2, "디자인"),
    thumbnailUrl: null,
    savedAt: daysAgo(7),
  },
  {
    linkId: 25,
    title: "면접관 기억에 남는 필승 1분 자기소개는?",
    source: "example.com",
    representativeTag: tag(3, "커리어"),
    thumbnailUrl: null,
    savedAt: daysAgo(1),
  },
  {
    linkId: 26,
    title: "Obsidian CEO가 직접 만든 옵시디언 스킬",
    source: "example.com",
    representativeTag: tag(4, "개발"),
    thumbnailUrl: null,
    savedAt: daysAgo(2),
  },
];

export const RECENT_SEARCH_KEYWORDS = ["사우나", "오늘의집", "면접", "피그마"];

export const SEARCH_RESULT_LINKS: Link[] = [
  {
    linkId: 11,
    title: "바이브 코딩 결과물이 다 평범해 보이는 진짜 이유",
    source: "example.com",
    representativeTag: null,
    thumbnailUrl: null,
    savedAt: daysAgo(0),
  },
  {
    linkId: 12,
    title: "오늘의집은 어떻게 200명의 리서처를 만들고 사용자 경험을 개선했나",
    source: "example.com",
    representativeTag: null,
    thumbnailUrl: null,
    savedAt: daysAgo(0),
  },
  {
    linkId: 13,
    title: "신입 디자이너가 꼭 알아야 할 실험 설계 팁",
    source: "example.com",
    representativeTag: null,
    thumbnailUrl: null,
    savedAt: daysAgo(1),
  },
  {
    linkId: 14,
    title: "Figma Variables 정리",
    source: "example.com",
    representativeTag: null,
    thumbnailUrl: null,
    savedAt: daysAgo(2),
  },
  {
    linkId: 15,
    title: "면접관 기억에 남는 필승 1분 자기소개는?",
    source: "example.com",
    representativeTag: null,
    thumbnailUrl: null,
    savedAt: daysAgo(2),
  },
  {
    linkId: 16,
    title: "모르고 간 카페가 대구 3대 커피 어쩌구라네",
    source: "example.com",
    representativeTag: null,
    thumbnailUrl: null,
    savedAt: daysAgo(3),
  },
];

export const RECENT_VIEWED_LINKS: Link[] = [
  {
    linkId: 1,
    title: "신입 디자이너가 꼭 알아야 할 실험 설계 팁",
    source: "example.com",
    representativeTag: null,
    thumbnailUrl: null,
    savedAt: daysAgo(0),
  },
  {
    linkId: 2,
    title: "Figma Variables 정리",
    source: "example.com",
    representativeTag: null,
    thumbnailUrl: null,
    savedAt: daysAgo(1),
  },
  {
    linkId: 3,
    title: "사용자 인터뷰 결과를 디자인에 반영하는 방법",
    source: "example.com",
    representativeTag: null,
    thumbnailUrl: null,
    savedAt: daysAgo(2),
  },
];
