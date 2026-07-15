import type { Folder } from "@shared/types/folder.types";
import type { Link } from "@shared/types/link.types";
import { render, screen } from "@testing-library/react-native";

import { FolderSection } from "./FolderSection";

const folder: Folder = {
  id: 1,
  name: "매쉬업 활동",
  linkCount: 2,
  lastSavedAt: new Date().toISOString(),
};

const links: Link[] = [
  {
    id: 1,
    title: "링크 A",
    source: "example.com",
    representativeTag: null,
    thumbnailUrl: null,
    savedAt: new Date().toISOString(),
  },
  {
    id: 2,
    title: "링크 B",
    source: "example.com",
    representativeTag: null,
    thumbnailUrl: null,
    savedAt: new Date().toISOString(),
  },
];

describe("FolderSection", () => {
  test("폴더명을 보여준다", async () => {
    await render(<FolderSection folder={folder} links={links} />);
    expect(screen.getByText("매쉬업 활동")).toBeOnTheScreen();
  });

  test("폴더의 링크들을 카드로 렌더한다", async () => {
    await render(<FolderSection folder={folder} links={links} />);
    expect(screen.getByText("링크 A")).toBeOnTheScreen();
    expect(screen.getByText("링크 B")).toBeOnTheScreen();
  });
});
