import { render, screen } from "@testing-library/react-native";

import { FolderListSkeleton } from "./FolderListSkeleton";

describe("FolderListSkeleton", () => {
  // 리스트 배경(gray-800)과 기본 블록 색이 같아 블록이 보이지 않았다 — 리스트용 블록 색을 쓴다.
  test("블록은 리스트 배경보다 밝은 색을 쓴다", async () => {
    await render(<FolderListSkeleton />);

    const blocks = screen.getAllByTestId("folder-list-skeleton-block");
    expect(blocks.length).toBeGreaterThan(0);
    for (const block of blocks) {
      expect(block.props.className).toContain("bg-background-list-selected");
    }
  });
});
