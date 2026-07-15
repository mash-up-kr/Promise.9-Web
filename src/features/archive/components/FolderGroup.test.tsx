import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import { FolderGroup } from "./FolderGroup";

describe("FolderGroup", () => {
  test("자식들을 모두 렌더한다", async () => {
    await render(
      <FolderGroup>
        <Text>전체</Text>
        <Text>미분류</Text>
        <Text>즐겨찾기</Text>
      </FolderGroup>,
    );
    expect(screen.getByText("전체")).toBeOnTheScreen();
    expect(screen.getByText("미분류")).toBeOnTheScreen();
    expect(screen.getByText("즐겨찾기")).toBeOnTheScreen();
  });

  test("자식 사이에만 divider 를 넣는다 (n개 → n-1개)", async () => {
    await render(
      <FolderGroup>
        <Text>전체</Text>
        <Text>미분류</Text>
        <Text>즐겨찾기</Text>
      </FolderGroup>,
    );
    expect(screen.getAllByTestId("folder-divider")).toHaveLength(2);
  });
});
