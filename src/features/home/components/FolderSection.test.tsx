import type { Folder } from "@shared/types/folder.types";
import type { Link } from "@shared/types/link.types";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { FolderSection } from "./FolderSection";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ push: mockPush }) }));

const folder: Folder = {
  folderId: 1,
  folderName: "매쉬업 활동",
  linkCount: 2,
  lastSavedAt: new Date().toISOString(),
};

const links: Link[] = [
  {
    linkId: 1,
    title: "링크 A",
    source: "example.com",
    representativeTag: null,
    thumbnailUrl: null,
    savedAt: new Date().toISOString(),
  },
  {
    linkId: 2,
    title: "링크 B",
    source: "example.com",
    representativeTag: null,
    thumbnailUrl: null,
    savedAt: new Date().toISOString(),
  },
];

describe("FolderSection", () => {
  beforeEach(() => mockPush.mockClear());

  test("폴더명을 보여준다", async () => {
    await render(<FolderSection folder={folder} links={links} />);
    expect(screen.getByText("매쉬업 활동")).toBeOnTheScreen();
  });

  test("폴더 헤더를 누르면 해당 폴더 상세로 이동한다", async () => {
    await render(<FolderSection folder={folder} links={links} />);
    await fireEvent.press(screen.getByLabelText("매쉬업 활동 폴더 열기"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/archive/[id]",
      params: { id: "1" },
    });
  });

  test("링크 카드를 누르면 링크 상세로 이동한다", async () => {
    await render(<FolderSection folder={folder} links={links} />);
    await fireEvent.press(screen.getByLabelText("링크 A"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/link/[id]",
      params: { id: "1" },
    });
  });

  test("폴더의 링크들을 카드로 렌더한다", async () => {
    await render(<FolderSection folder={folder} links={links} />);
    expect(screen.getByText("링크 A")).toBeOnTheScreen();
    expect(screen.getByText("링크 B")).toBeOnTheScreen();
  });
});
