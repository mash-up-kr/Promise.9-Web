import type { ArchiveFolder } from "./archive.types";
import { applyFolderOrder, resolveEmptyLinksMessage } from "./archive.utils";

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
