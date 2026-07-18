import {
  basicCounts,
  createFolder,
  createLink,
  deleteLink,
  getLinkDetail,
  listFolders,
  listLinks,
  recentlyViewed,
  resetStore,
  updateLink,
} from "./store";

beforeEach(() => {
  resetStore();
});

describe("mock store — 시드 하이드레이트", () => {
  test("링크·폴더가 시드에서 로드된다", () => {
    expect(listLinks().items.length).toBeGreaterThan(0);
    expect(listFolders()).toHaveLength(3);
  });

  test("폴더 linkCount 는 소속 링크 수로 파생된다", () => {
    const folders = listFolders();
    for (const f of folders) {
      const members = listLinks({ folderId: f.folderId }).items.length;
      expect(f.linkCount).toBe(members);
    }
  });

  test("기본 폴더 카운트(전체·미분류·즐겨찾기·휴지통)가 계산된다", () => {
    const c = basicCounts();
    expect(c.all).toBe(listLinks().items.length);
    expect(c.favorites).toBeGreaterThan(0); // 시드 보강으로 즐겨찾기 존재
    expect(c.trash).toBe(0);
  });
});

describe("이미지 없는 링크는 리스트 뒤로 정렬", () => {
  test("썸네일 있는 링크가 모두 썸네일 없는 링크보다 앞에 온다", () => {
    const items = listLinks().items;
    const firstNull = items.findIndex((l) => !l.thumbnailUrl);
    // 시드에 썸네일 없는 링크가 존재해야 의미 있는 검증이 된다.
    expect(firstNull).toBeGreaterThan(-1);
    // 첫 번째 null 이후로는 모두 null 이어야 한다(썸네일 있는 게 뒤에 끼면 실패).
    expect(items.slice(firstNull).every((l) => !l.thumbnailUrl)).toBe(true);
  });

  test("썸네일 없는 링크끼리는 최신 저장 순을 유지한다", () => {
    const noThumb = listLinks().items.filter((l) => !l.thumbnailUrl);
    for (let i = 1; i < noThumb.length; i++) {
      expect(noThumb[i - 1].savedAt >= noThumb[i].savedAt).toBe(true);
    }
  });

  test("sort:'recent' 는 썸네일 유무와 무관하게 최신 저장 순 — 새로 저장한(썸네일 없는) 링크가 맨 앞", () => {
    const created = createLink({
      url: "https://example.com/newest-recent",
      folderId: null,
      memo: null,
      remindType: null,
    });
    const recent = listLinks({ sort: "recent" }).items;
    expect(recent[0].linkId).toBe(created.linkId);
  });

  test("기본(thumbnail) 정렬에선 썸네일 없는 새 링크가 맨 앞이 아니다", () => {
    const created = createLink({
      url: "https://example.com/newest-thumb",
      folderId: null,
      memo: null,
      remindType: null,
    });
    const items = listLinks().items;
    expect(items[0].linkId).not.toBe(created.linkId);
    expect(items.map((l) => l.linkId)).toContain(created.linkId);
  });
});

describe("완전 상태형 — 쓰기가 읽기에 반영", () => {
  test("createLink → 목록·전체 카운트에 등장", () => {
    const before = basicCounts().all;
    const created = createLink({
      url: "https://example.com/new-ut",
      folderId: null,
      memo: "메모",
      remindType: null,
    });
    expect(basicCounts().all).toBe(before + 1);
    const detail = getLinkDetail(created.linkId);
    expect(detail?.memo).toBe("메모");
  });

  test("updateLink folderId → 양쪽 폴더 카운트 반영", () => {
    const folder = listFolders()[0];
    const before = folder.linkCount;
    const target = listLinks({ folderId: null }).items[0];
    updateLink(target.linkId, { folderId: folder.folderId });
    const after = listFolders().find((f) => f.folderId === folder.folderId);
    expect(after?.linkCount).toBe(before + 1);
    expect(
      listLinks({ folderId: folder.folderId }).items.map((l) => l.linkId),
    ).toContain(target.linkId);
  });

  test("즐겨찾기 토글 → favorite 필터에 반영", () => {
    const link = listLinks({ favorite: false }).items[0];
    updateLink(link.linkId, { isFavorite: true });
    expect(listLinks({ favorite: true }).items.map((l) => l.linkId)).toContain(
      link.linkId,
    );
  });

  test("deleteLink(soft) → 목록에서 빠지고 휴지통으로", () => {
    const link = listLinks().items[0];
    const trashBefore = basicCounts().trash;
    deleteLink(link.linkId);
    expect(listLinks().items.map((l) => l.linkId)).not.toContain(link.linkId);
    expect(basicCounts().trash).toBe(trashBefore + 1);
    expect(getLinkDetail(link.linkId)).toBeUndefined();
  });

  test("상세 열람(markViewed) → 최근 본에 반영", () => {
    const link = listLinks().items[0];
    getLinkDetail(link.linkId, { markViewed: true });
    expect(recentlyViewed().map((l) => l.linkId)).toContain(link.linkId);
  });

  test("createFolder → 폴더 목록에 추가", () => {
    const before = listFolders().length;
    const folder = createFolder({ folderName: "새 폴더" });
    expect(listFolders()).toHaveLength(before + 1);
    expect(folder.folderName).toBe("새 폴더");
    expect(folder.linkCount).toBe(0);
  });
});

describe("카테고리 둘러보기", () => {
  test("category 필터는 tags 포함 여부로 링크를 거른다", () => {
    // 시드에 존재하는 카테고리 하나 골라 필터
    const someTag = getLinkDetail(listLinks().items[0].linkId)?.tags?.[0]?.name;
    if (!someTag) return;
    const filtered = listLinks({ category: someTag }).items;
    expect(filtered.length).toBeGreaterThan(0);
  });
});
