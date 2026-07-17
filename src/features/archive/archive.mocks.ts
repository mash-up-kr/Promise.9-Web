import type { Link, LinkTag } from "@shared/types/link.types";

// 폴더 상세 링크 API 연동 전 그리드 구성용 mock. 내용은 Figma `archive-detail` 예시를 따른다.
const DAY_MS = 24 * 60 * 60 * 1000;
const daysAgo = (days: number) =>
  new Date(Date.now() - days * DAY_MS).toISOString();

function tag(tagId: number, name: string): LinkTag {
  return { tagId, name, sourceType: "ai", sortOrder: null };
}

export const FOLDER_LINKS: Link[] = [
  {
    linkId: 1,
    title: "무조건 행복해지는 인생 치트키 사우나",
    source: "example.com",
    representativeTag: tag(1, "장소"),
    thumbnailUrl: null,
    savedAt: daysAgo(0),
  },
  {
    linkId: 2,
    title: "피그마 파일 PSD로 변환하는 방법",
    source: "example.com",
    representativeTag: tag(2, "디자인"),
    thumbnailUrl: null,
    savedAt: daysAgo(3),
  },
  {
    linkId: 3,
    title: "누구나 60점을 만드는 시대에, 프로덕트 디자이너가 던져야 할 질문",
    source: "example.com",
    representativeTag: tag(2, "디자인"),
    thumbnailUrl: null,
    savedAt: daysAgo(7),
  },
  {
    linkId: 4,
    title: "오늘의집은 어떻게 200명의 리서처를 만들었을까?",
    source: "example.com",
    representativeTag: tag(2, "디자인"),
    thumbnailUrl: null,
    savedAt: daysAgo(7),
  },
  {
    linkId: 5,
    title: "신입 디자이너가 꼭 알아야 할 실험 설계 팁",
    source: "example.com",
    representativeTag: null,
    thumbnailUrl: null,
    savedAt: daysAgo(10),
  },
  {
    linkId: 6,
    title: "Obsidian CEO가 직접 만든 옵시디언 스킬",
    source: "example.com",
    representativeTag: tag(3, "개발"),
    thumbnailUrl: null,
    savedAt: daysAgo(12),
  },
];
