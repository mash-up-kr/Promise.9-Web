import type { LinkProcessingStatus } from "@shared/types/link.types";

// home.utils 가 링크 변환(toLink)을 위해 link.queries 를 끌어오는데, 그 안의 client.ts 는 import 시
// EXPO_PUBLIC_API_BASE_URL 를 요구한다. 순수 함수만 검증하므로 apiClient 는 비워 둔다.
jest.mock("@shared/api", () => ({ apiClient: {} }));

import { LINK_PROCESSING } from "@/features/link/link.constants";

import { HOME_POLICY } from "./home.constants";
import type { HomeKeyword } from "./home.types";
import {
  getProcessingRefetchInterval,
  selectFrequentFolders,
  selectRemindLinks,
  selectTopKeywords,
} from "./home.utils";

const listItem = (
  linkId: number,
  reminderAt: string | null,
  title: string | null = `링크 ${linkId}`,
  savedAt = "2026-08-01T00:00:00.000Z",
  processingStatus: LinkProcessingStatus | undefined = "SUCCESS",
) => ({
  linkId,
  title,
  source: "example.com",
  representativeTag: null,
  thumbnailUrl: null,
  savedAt,
  reminderAt,
  processingStatus,
});

const linkListResponse = (links: ReturnType<typeof listItem>[]) => ({
  links,
  pagination: { nextCursor: null, hasNext: false, limit: 9 },
});

const item = (
  label: string,
  linkCount: number,
  type: "folder" | "tag" = "tag",
) => ({
  key: `${type}:${label}`,
  type,
  label,
  linkCount,
  lastViewedAt: null,
});

describe("selectRemindLinks", () => {
  // 정렬(알림 가까운 순)·상한은 서버 요청(sortBy=reminderAt&order=asc&limit)이 맡는다 — 순서를 유지한다.
  it("목록 응답을 알림 시각이 붙은 링크로 변환한다", () => {
    const selected = selectRemindLinks(
      linkListResponse([
        listItem(1, "2026-08-10T00:00:00.000Z"),
        listItem(2, "2026-08-22T00:00:00.000Z"),
      ]),
    );

    expect(selected).toEqual([
      {
        linkId: 1,
        title: "링크 1",
        source: "example.com",
        representativeTag: null,
        thumbnailUrl: null,
        savedAt: "2026-08-01T00:00:00.000Z",
        reminderAt: "2026-08-10T00:00:00.000Z",
      },
      expect.objectContaining({
        linkId: 2,
        reminderAt: "2026-08-22T00:00:00.000Z",
      }),
    ]);
  });

  // reminder=true 조회는 알림 없는 링크를 주지 않지만, 배지가 빈 카드는 계약이 어긋나도 막는다.
  it("알림이 없는 항목은 뺀다", () => {
    const selected = selectRemindLinks(
      linkListResponse([
        listItem(1, null),
        listItem(2, "2026-08-22T00:00:00.000Z"),
      ]),
    );

    expect(selected.map((link) => link.linkId)).toEqual([2]);
  });

  it("알림이 없으면 빈 배열이다 — 섹션 자체를 숨기는 근거", () => {
    expect(selectRemindLinks(linkListResponse([]))).toEqual([]);
  });
});

describe("selectTopKeywords", () => {
  // 노출 조건(링크 3개 이상인 후보 3개 이상)·정렬은 서버 정책 — 미달이면 data 가 null 로 온다.
  it("서버가 null 을 주면 빈 배열이다 — 섹션 자체를 숨기는 근거", () => {
    expect(selectTopKeywords(null)).toEqual([]);
  });

  it("추천 항목을 서버 순서 그대로 키워드로 변환한다", () => {
    const selected = selectTopKeywords({
      items: [item("맛집", 8), item("디자인", 5, "folder"), item("개발", 3)],
    });

    expect(selected).toEqual<HomeKeyword[]>([
      { name: "맛집", linkCount: 8 },
      { name: "디자인", linkCount: 5 },
      { name: "개발", linkCount: 3 },
    ]);
  });

  // 같은 이름의 폴더와 태그가 둘 다 오면 칩이 겹쳐 보인다 — 앞(링크 많은 쪽)만 남긴다.
  it("이름이 같은 폴더·태그는 하나로 합친다", () => {
    const selected = selectTopKeywords({
      items: [item("디자인", 12, "folder"), item("디자인", 4), item("개발", 3)],
    });

    expect(selected.map((keyword) => keyword.name)).toEqual(["디자인", "개발"]);
    expect(selected[0].linkCount).toBe(12);
  });
});

const folder = (
  folderId: number,
  overrides: {
    viewCount?: number;
    lastSavedAt?: string | null;
    linkCount?: number;
  } = {},
) => ({
  folderId,
  folderName: `폴더 ${folderId}`,
  color: "#ffffff",
  linkCount: overrides.linkCount ?? 3,
  lastSavedAt: overrides.lastSavedAt ?? null,
  ...(overrides.viewCount === undefined
    ? {}
    : { viewCount: overrides.viewCount }),
});

const response = (folders: ReturnType<typeof folder>[]) => ({
  systemFolders: {
    all: { linkCount: 0 },
    uncategorized: { linkCount: 0 },
    favorite: { linkCount: 0 },
    recentlyDeleted: { linkCount: 0 },
  },
  folders,
});

describe("selectFrequentFolders", () => {
  it("조회수가 많은 순으로 최대 2개를 고른다", () => {
    const { folders } = selectFrequentFolders(
      response([
        folder(1, { viewCount: 3 }),
        folder(2, { viewCount: 10 }),
        folder(3, { viewCount: 7 }),
      ]),
    );

    expect(folders.map((f) => f.folderId)).toEqual([2, 3]);
    expect(folders).toHaveLength(HOME_POLICY.frequentFolders.maxFolders);
  });

  // 링크 0개 폴더가 상위에 오면 제목만 있는 빈 캐러셀이 생긴다(리뷰 피드백).
  it("링크가 없는 폴더는 후보에서 뺀다", () => {
    const { folders, hasAnyFolder } = selectFrequentFolders(
      response([
        folder(1, { linkCount: 0, viewCount: 99 }),
        folder(2, { linkCount: 2 }),
      ]),
    );

    expect(folders.map((f) => f.folderId)).toEqual([2]);
    expect(hasAnyFolder).toBe(true);
  });

  it("폴더가 하나도 없으면 hasAnyFolder 가 false 다", () => {
    expect(selectFrequentFolders(response([]))).toEqual({
      folders: [],
      hasAnyFolder: false,
    });
  });

  // viewCount 는 서버 feature/folder-view-count 머지 전까지 응답에 없다.
  it("조회수가 없으면 마지막 저장 시각 최신순으로 폴백한다", () => {
    const { folders } = selectFrequentFolders(
      response([
        folder(1, { lastSavedAt: "2026-08-01T00:00:00.000Z" }),
        folder(2, { lastSavedAt: "2026-08-10T00:00:00.000Z" }),
        folder(3, { lastSavedAt: "2026-08-05T00:00:00.000Z" }),
      ]),
    );

    expect(folders.map((f) => f.folderId)).toEqual([2, 3]);
  });

  it("저장 이력이 없는 폴더는 뒤로 보낸다", () => {
    const { folders } = selectFrequentFolders(
      response([
        folder(1, { lastSavedAt: null }),
        folder(2, { lastSavedAt: "2026-08-10T00:00:00.000Z" }),
      ]),
    );

    expect(folders.map((f) => f.folderId)).toEqual([2, 1]);
  });

  it("서버 폴더를 UI 폴더 모델로 변환한다", () => {
    const [first] = selectFrequentFolders(
      response([folder(1, { viewCount: 1, lastSavedAt: null })]),
    ).folders;

    expect(first).toEqual({
      folderId: 1,
      folderName: "폴더 1",
      linkCount: 3,
      lastSavedAt: null,
    });
  });
});

// 저장 직후 서버가 제목·썸네일·요약을 채우는 데 몇 초 걸린다(processingStatus PENDING). 목록 응답엔
// 상태가 없어 제목이 비어 있는 링크를 "처리 중" 으로 보되, 서버가 분석 실패를 FAILED 로 확정하면
// 제목은 끝내 채워지지 않으므로 저장 시각 기준 상한을 함께 본다.
describe("getProcessingRefetchInterval", () => {
  const now = Date.parse("2026-09-08T00:00:00.000Z");
  const justSaved = new Date(now - 30_000).toISOString();
  const longAgo = new Date(now - LINK_PROCESSING.maxWaitMs - 1).toISOString();

  // 목록 API 가 상세와 같은 processingStatus 를 내려준다(서버 PR #142) — 제목 유무가 아니라 PENDING 으로 판단한다.
  it("처리 중(PENDING)인 링크가 있으면 제목이 채워졌어도 폴링 간격을 돌려준다", () => {
    expect(
      getProcessingRefetchInterval(
        linkListResponse([
          listItem(1, null, "제목은 먼저 채워짐", justSaved, "PENDING"),
          listItem(2, null),
        ]),
        now,
      ),
    ).toBe(LINK_PROCESSING.pollIntervalMs);
  });

  it("제목이 비어 있어도 처리가 끝났으면(FAILED·SUCCESS) 폴링하지 않는다", () => {
    expect(
      getProcessingRefetchInterval(
        linkListResponse([
          listItem(1, null, null, justSaved, "FAILED"),
          listItem(2, null, "", justSaved, "SUCCESS"),
        ]),
        now,
      ),
    ).toBe(false);
  });

  it("모든 링크가 완료거나 목록이 비면 폴링하지 않는다", () => {
    expect(
      getProcessingRefetchInterval(linkListResponse([listItem(1, null)]), now),
    ).toBe(false);
    expect(getProcessingRefetchInterval(linkListResponse([]), now)).toBe(false);
    expect(getProcessingRefetchInterval(undefined, now)).toBe(false);
  });

  // 상태가 끝내 확정되지 않는 경우를 대비한 상한 — 상세 재조회와 같은 정책.
  it("PENDING 이어도 저장한 지 오래됐으면 폴링하지 않는다", () => {
    expect(
      getProcessingRefetchInterval(
        linkListResponse([listItem(1, null, null, longAgo, "PENDING")]),
        now,
      ),
    ).toBe(false);
  });

  it("저장 시각을 해석할 수 없으면 폴링하지 않는다", () => {
    expect(
      getProcessingRefetchInterval(
        linkListResponse([listItem(1, null, null, "언제인지 모름", "PENDING")]),
        now,
      ),
    ).toBe(false);
  });

  it("응답에 처리 상태가 없으면(구버전 서버) 폴링하지 않는다", () => {
    expect(
      getProcessingRefetchInterval(
        linkListResponse([listItem(1, null, null, justSaved, undefined)]),
        now,
      ),
    ).toBe(false);
  });
});
