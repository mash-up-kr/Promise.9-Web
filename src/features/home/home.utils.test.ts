import { HOME_POLICY } from "./home.constants";
import type { HomeKeyword, RemindLink } from "./home.types";
import {
  selectFrequentFolders,
  selectRemindLinks,
  selectTopKeywords,
} from "./home.utils";

const remindLink = (linkId: number, reminderAt: string): RemindLink => ({
  linkId,
  title: `링크 ${linkId}`,
  source: "example.com",
  representativeTag: null,
  thumbnailUrl: null,
  savedAt: "2026-08-01T00:00:00.000Z",
  reminderAt,
});

const keyword = (name: string, linkCount: number): HomeKeyword => ({
  name,
  linkCount,
});

describe("selectRemindLinks", () => {
  it("알림 날짜가 가까운 순으로 정렬한다", () => {
    const selected = selectRemindLinks([
      remindLink(1, "2026-08-22T00:00:00.000Z"),
      remindLink(2, "2026-08-10T00:00:00.000Z"),
      remindLink(3, "2026-08-15T00:00:00.000Z"),
    ]);

    expect(selected.map((link) => link.linkId)).toEqual([2, 3, 1]);
  });

  it(`최대 ${HOME_POLICY.remind.maxLinks} 개까지만 남긴다`, () => {
    const links = Array.from({ length: 12 }, (_, index) =>
      remindLink(
        index,
        `2026-08-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`,
      ),
    );

    expect(selectRemindLinks(links)).toHaveLength(HOME_POLICY.remind.maxLinks);
  });

  it("알림이 없으면 빈 배열이다 — 섹션 자체를 숨기는 근거", () => {
    expect(selectRemindLinks([])).toEqual([]);
  });
});

describe("selectTopKeywords", () => {
  // 시안 정책: 링크 3개 이상인 태그가 3종류 이상 모였을 때만 노출.
  it("링크 3개 이상인 태그가 3종류 이상이면 링크 많은 순으로 준다", () => {
    const selected = selectTopKeywords([
      keyword("운동", 5),
      keyword("맛집", 8),
      keyword("개발", 3),
    ]);

    expect(selected.map((item) => item.name)).toEqual(["맛집", "운동", "개발"]);
  });

  it("링크 3개 미만인 태그는 종류 수에 넣지 않는다", () => {
    expect(
      selectTopKeywords([
        keyword("운동", 5),
        keyword("맛집", 8),
        keyword("개발", 2),
      ]),
    ).toEqual([]);
  });

  it("조건을 채운 태그가 3종류 미만이면 빈 배열이다", () => {
    expect(selectTopKeywords([keyword("운동", 5), keyword("맛집", 8)])).toEqual(
      [],
    );
  });

  it(`최대 ${HOME_POLICY.keywords.max} 개까지만 남긴다`, () => {
    const keywords = Array.from({ length: 20 }, (_, index) =>
      keyword(`태그 ${index}`, index + 3),
    );

    expect(selectTopKeywords(keywords)).toHaveLength(HOME_POLICY.keywords.max);
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
