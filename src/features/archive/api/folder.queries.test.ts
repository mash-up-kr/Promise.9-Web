// client.ts 는 import 시 EXPO_PUBLIC_API_BASE_URL 를 요구하므로 @shared/api 를 mock 한다.
jest.mock("@shared/api", () => ({
  apiClient: { get: jest.fn(), post: jest.fn() },
}));

import { toArchiveFolderData } from "./folder.queries";

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

  it("systemFolders 카운트를 기본 폴더 항목으로 변환한다", () => {
    expect(toArchiveFolderData(response).systemFolders).toEqual([
      { id: "all", name: "전체", count: 10, tone: "gray" },
      { id: "uncategorized", name: "미분류", count: 2, tone: "gray" },
      { id: "favorites", name: "즐겨찾기", count: 0, tone: "gray" },
      { id: "trash", name: "최근 삭제된 링크", count: 1, tone: "gray" },
    ]);
  });

  it("사용자 폴더의 hex color 를 tone 으로 변환하고 기본색은 gray 로 폴백한다", () => {
    expect(toArchiveFolderData(response).myFolders).toEqual([
      { id: "3", name: "디자인", count: 5, tone: "blue" },
      { id: "7", name: "기타", count: 0, tone: "gray" },
    ]);
  });
});
