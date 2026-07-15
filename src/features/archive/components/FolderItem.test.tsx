import { fireEvent, render, screen } from "@testing-library/react-native";

import { FolderItem } from "./FolderItem";

describe("FolderItem", () => {
  test("이름과 개수를 렌더한다", async () => {
    await render(<FolderItem name="전체" count={370} tone="gray" />);
    expect(screen.getByText("전체")).toBeOnTheScreen();
    expect(screen.getByText("370")).toBeOnTheScreen();
  });

  test("누르면 onPress 가 호출된다", async () => {
    const onPress = jest.fn();
    await render(
      <FolderItem name="AI" count={12} tone="blue" onPress={onPress} />,
    );
    fireEvent.press(screen.getByText("AI"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
