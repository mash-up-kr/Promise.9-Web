import type { Folder } from "@shared/types/folder.types";
import type { Link, LinkTag } from "@shared/types/link.types";

// API 연동 전 홈 화면 구성용 mock. 내용은 Figma 시안 예시를 따른다.
// savedAt 은 상대시간 표기 확인을 위해 조회 시점 기준으로 생성한다.
const DAY_MS = 24 * 60 * 60 * 1000;
const daysAgo = (days: number) =>
  new Date(Date.now() - days * DAY_MS).toISOString();

function tag(tagId: number, name: string): LinkTag {
  return { tagId, name, sourceType: "ai", sortOrder: null };
}

export const HOME_RECENT_LINKS: Link[] = [
  {
    linkId: 1,
    title: "바이브 코딩 결과물이 다 평범해 보이는 진짜 이유",
    source: "example.com",
    representativeTag: tag(1, "AI"),
    thumbnailUrl: null,
    savedAt: daysAgo(0),
  },
  {
    linkId: 2,
    title: "모르고 간 카페가 대구 3대 커피 어쩌구라네",
    source: "example.com",
    representativeTag: tag(2, "장소"),
    thumbnailUrl: null,
    savedAt: daysAgo(0),
  },
  {
    linkId: 3,
    title: "오늘의집은 어떻게 200명의 리서처를 만들고 사용자 경험을 개선했나",
    source: "example.com",
    representativeTag: tag(3, "커리어"),
    thumbnailUrl: null,
    savedAt: daysAgo(1),
  },
  {
    linkId: 4,
    title: "Figma Variables 정리",
    source: "example.com",
    representativeTag: tag(4, "디자인"),
    thumbnailUrl: null,
    savedAt: daysAgo(0),
  },
  {
    linkId: 5,
    title: "신입 디자이너가 꼭 알아야 할 실험 설계 팁",
    source: "example.com",
    representativeTag: null,
    thumbnailUrl: null,
    savedAt: daysAgo(3),
  },
  {
    linkId: 6,
    title: "Obsidian CEO가 직접 만든 옵시디언 스킬",
    source: "example.com",
    representativeTag: tag(5, "개발"),
    thumbnailUrl: null,
    savedAt: daysAgo(3),
  },
];

export interface HomeFolderSection {
  folder: Folder;
  links: Link[];
}

export const HOME_FOLDER_SECTIONS: HomeFolderSection[] = [
  {
    folder: {
      folderId: 1,
      folderName: "매쉬업 활동",
      linkCount: 3,
      lastSavedAt: daysAgo(0),
    },
    links: [
      {
        linkId: 1,
        title: "바이브 코딩 결과물이 다 평범해 보이는 진짜 이유",
        source: "example.com",
        representativeTag: tag(1, "AI"),
        thumbnailUrl: null,
        savedAt: daysAgo(0),
      },
      {
        linkId: 6,
        title: "Obsidian CEO가 직접 만든 옵시디언 스킬",
        source: "example.com",
        representativeTag: tag(5, "개발"),
        thumbnailUrl: null,
        savedAt: daysAgo(3),
      },
      {
        linkId: 5,
        title: "신입 디자이너가 꼭 알아야 할 실험 설계 팁",
        source: "example.com",
        representativeTag: tag(4, "디자인"),
        thumbnailUrl: null,
        savedAt: daysAgo(3),
      },
    ],
  },
  {
    folder: {
      folderId: 2,
      folderName: "취업",
      linkCount: 2,
      lastSavedAt: daysAgo(1),
    },
    links: [
      {
        linkId: 7,
        title: "면접 가기 전 준비해야 할 질문 3가지",
        source: "example.com",
        representativeTag: tag(3, "커리어"),
        thumbnailUrl: null,
        savedAt: daysAgo(1),
      },
      {
        linkId: 8,
        title: "면접관 기억에 남는 필승 1분 자기소개는?",
        source: "example.com",
        representativeTag: tag(3, "커리어"),
        thumbnailUrl: null,
        savedAt: daysAgo(2),
      },
    ],
  },
  {
    folder: {
      folderId: 3,
      folderName: "대구 여행",
      linkCount: 2,
      lastSavedAt: daysAgo(0),
    },
    links: [
      {
        linkId: 2,
        title: "모르고 간 카페가 대구 3대 커피 어쩌구라네",
        source: "example.com",
        representativeTag: tag(2, "장소"),
        thumbnailUrl: null,
        savedAt: daysAgo(0),
      },
      {
        linkId: 9,
        title: "간송 전형필이 신념으로 지켜낸 문화유산들을 조명하는 전시!",
        source: "example.com",
        representativeTag: tag(6, "문화"),
        thumbnailUrl: null,
        savedAt: daysAgo(1),
      },
    ],
  },
];
