jest.mock("@shared/api", () => ({ apiClient: { get: jest.fn() } }));

import { folderQueries } from "@/entities/folder/folder.queries";
import { linkQueries } from "@/entities/link/link.queries";

import {
  HOME_FOLDER_LINK_LIMIT,
  HOME_FREQUENT_FOLDER_LIMIT,
  HOME_RECENT_LINK_LIMIT,
  homeQueries,
  selectFrequentFolders,
} from "./home.queries";

const folder = (
  folderId: number,
  overrides: { viewCount?: number; lastSavedAt?: string | null } = {},
) => ({
  folderId,
  folderName: `폴더 ${folderId}`,
  color: "#ffffff",
  linkCount: 3,
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

describe("homeQueries.recentLinks", () => {
  // 시안 정책: 최신 저장순 최대 9개.
  it("최근 저장 정책 params 로 링크 목록 쿼리를 만든다", () => {
    expect(homeQueries.recentLinks().queryKey).toEqual(
      linkQueries.list({
        sortBy: "savedAt",
        order: "desc",
        limit: HOME_RECENT_LINK_LIMIT,
      }).queryKey,
    );
  });
});

describe("homeQueries.folderLinks", () => {
  it("폴더별 링크를 folderId 로 조회한다", () => {
    expect(homeQueries.folderLinks(7).queryKey).toEqual(
      linkQueries.list({ folderId: 7, limit: HOME_FOLDER_LINK_LIMIT }).queryKey,
    );
  });
});

describe("homeQueries.frequentFolders", () => {
  // 보관함과 같은 GET /folders 캐시를 쓰고 select 만 홈용으로 바꾼다.
  it("폴더 목록 쿼리와 같은 캐시 키를 쓴다", () => {
    expect(homeQueries.frequentFolders().queryKey).toEqual(
      folderQueries.list().queryKey,
    );
  });
});

describe("selectFrequentFolders", () => {
  it("조회수가 많은 순으로 최대 2개를 고른다", () => {
    const selected = selectFrequentFolders(
      response([
        folder(1, { viewCount: 3 }),
        folder(2, { viewCount: 10 }),
        folder(3, { viewCount: 7 }),
      ]),
    );

    expect(selected.map((f) => f.folderId)).toEqual([2, 3]);
    expect(selected).toHaveLength(HOME_FREQUENT_FOLDER_LIMIT);
  });

  // viewCount 는 서버 feature/folder-view-count 머지 전까지 응답에 없다.
  it("조회수가 없으면 마지막 저장 시각 최신순으로 폴백한다", () => {
    const selected = selectFrequentFolders(
      response([
        folder(1, { lastSavedAt: "2026-08-01T00:00:00.000Z" }),
        folder(2, { lastSavedAt: "2026-08-10T00:00:00.000Z" }),
        folder(3, { lastSavedAt: "2026-08-05T00:00:00.000Z" }),
      ]),
    );

    expect(selected.map((f) => f.folderId)).toEqual([2, 3]);
  });

  it("저장 이력이 없는 폴더는 뒤로 보낸다", () => {
    const selected = selectFrequentFolders(
      response([
        folder(1, { lastSavedAt: null }),
        folder(2, { lastSavedAt: "2026-08-10T00:00:00.000Z" }),
      ]),
    );

    expect(selected.map((f) => f.folderId)).toEqual([2, 1]);
  });

  it("서버 폴더를 UI 폴더 모델로 변환한다", () => {
    const [first] = selectFrequentFolders(
      response([folder(1, { viewCount: 1, lastSavedAt: null })]),
    );

    expect(first).toEqual({
      folderId: 1,
      folderName: "폴더 1",
      linkCount: 3,
      lastSavedAt: null,
    });
  });
});
