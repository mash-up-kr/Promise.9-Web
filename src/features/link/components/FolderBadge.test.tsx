import { fireEvent, render, screen } from "@testing-library/react-native";

import { FolderBadge } from "./FolderBadge";

describe("FolderBadge", () => {
  test("폴더가 지정되면 폴더명을 렌더하고 '폴더선택'은 노출하지 않는다", async () => {
    await render(<FolderBadge folder="디자인" folderColor="purple" />);
    expect(screen.getByText("디자인")).toBeOnTheScreen();
    expect(screen.queryByText("폴더선택")).toBeNull();
  });

  test("폴더가 없으면(미분류) '미분류'와 '폴더선택'을 함께 노출한다", async () => {
    await render(<FolderBadge />);
    expect(screen.getByText("미분류")).toBeOnTheScreen();
    expect(screen.getByText("폴더선택")).toBeOnTheScreen();
  });

  test("미분류 상태에서 '폴더선택'을 누르면 onPress 가 호출된다", async () => {
    const onPress = jest.fn();
    await render(<FolderBadge onPress={onPress} />);
    fireEvent.press(screen.getByText("폴더선택"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
