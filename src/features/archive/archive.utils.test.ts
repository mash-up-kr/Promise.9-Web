import type { ArchiveFolder } from "./archive.types";
import {
  applyFolderOrder,
  resolveEmptyLinksMessage,
  toArchiveFolderData,
} from "./archive.utils";

const folder = (id: string): ArchiveFolder => ({
  id,
  name: `폴더 ${id}`,
  count: 0,
  tone: "blue",
});

describe("applyFolderOrder", () => {
  test("로컬 순서가 없으면 서버 순서를 그대로 쓴다", () => {
    const folders = [folder("1"), folder("2"), folder("3")];
    expect(applyFolderOrder(folders, []).map((f) => f.id)).toEqual([
      "1",
      "2",
      "3",
    ]);
  });

  test("로컬 순서대로 서버 폴더를 재배열한다", () => {
    const folders = [folder("1"), folder("2"), folder("3")];
    expect(applyFolderOrder(folders, ["3", "1", "2"]).map((f) => f.id)).toEqual(
      ["3", "1", "2"],
    );
  });

  test("재조회로 서버 데이터가 새로 와도 로컬 순서를 유지한다", () => {
    const reordered = ["3", "1", "2"];
    // 카운트만 갱신된 새 배열 — 참조가 바뀌어도 순서는 로컬 기준이어야 한다.
    const refetched = [folder("1"), folder("2"), folder("3")];
    expect(applyFolderOrder(refetched, reordered).map((f) => f.id)).toEqual([
      "3",
      "1",
      "2",
    ]);
  });

  test("로컬 순서에 없는 폴더(새로 생성)는 서버 순서를 유지한 채 뒤에 붙인다", () => {
    const folders = [folder("1"), folder("2"), folder("3"), folder("4")];
    expect(applyFolderOrder(folders, ["3", "1"]).map((f) => f.id)).toEqual([
      "3",
      "1",
      "2",
      "4",
    ]);
  });

  test("로컬 순서에만 있고 서버에 없는 폴더(삭제됨)는 무시한다", () => {
    const folders = [folder("1"), folder("2")];
    expect(applyFolderOrder(folders, ["9", "2", "1"]).map((f) => f.id)).toEqual(
      ["2", "1"],
    );
  });
});

describe("toArchiveFolderData", () => {
  const response = {
    systemFolders: {
      all: { linkCount: 10 },
      uncategorized: { linkCount: 2 },
      favorite: { linkCount: 0 },
      recentlyDeleted: { linkCount: 1 },
    },
    folders: [
      {
        folderId: 3,
        folderName: "디자인",
        color: "#61a8ef",
        linkCount: 5,
        lastSavedAt: null,
      },
      {
        folderId: 7,
        folderName: "기타",
        color: "#000000",
        linkCount: 0,
        lastSavedAt: null,
      },
    ],
  };

  // 기본 폴더의 이름·순서는 정적 상수이므로 서버에서 오는 건 카운트뿐이다.
  test("systemFolders 를 countKey 별 링크 수로 변환한다", () => {
    expect(toArchiveFolderData(response).systemFolderCounts).toEqual({
      all: 10,
      uncategorized: 2,
      favorite: 0,
      recentlyDeleted: 1,
    });
  });

  test("사용자 폴더의 hex color 를 tone 으로 변환하고 기본색은 gray 로 폴백한다", () => {
    expect(toArchiveFolderData(response).myFolders).toEqual([
      { id: "3", name: "디자인", count: 5, tone: "blue" },
      { id: "7", name: "기타", count: 0, tone: "gray" },
    ]);
  });
});

describe("resolveEmptyLinksMessage", () => {
  test("기본 폴더마다 시안 문구를 준다", () => {
    expect(resolveEmptyLinksMessage("all").title).toBe(
      "아직 저장된 링크가 없어요",
    );
    expect(resolveEmptyLinksMessage("uncategorized").title).toBe(
      "분류되지 않은 링크가 없어요",
    );
    expect(resolveEmptyLinksMessage("favorites")).toEqual({
      title: "즐겨찾기한 링크가 없어요",
      description: "자주 보고 싶은 링크를 즐겨찾기 해보세요",
    });
    expect(resolveEmptyLinksMessage("trash").description).toBe(
      "삭제된 링크는 30일 동안 보관돼요",
    );
  });

  // 사용자 폴더는 시안에 빈 상태가 없어 전체 폴더 문구로 폴백한다.
  test("사용자 폴더는 전체 폴더 문구를 쓴다", () => {
    expect(resolveEmptyLinksMessage("7")).toEqual(
      resolveEmptyLinksMessage("all"),
    );
  });
});
