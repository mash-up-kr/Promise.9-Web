import { fireEvent, render, screen } from "@testing-library/react-native";

import { NewFolderButton } from "./NewFolderButton";

describe("NewFolderButton", () => {
  test("'새 폴더 추가' 라벨을 렌더한다", async () => {
    await render(<NewFolderButton onPress={jest.fn()} />);
    expect(screen.getByText("새 폴더 추가")).toBeOnTheScreen();
  });

  test("누르면 onPress 를 호출한다", async () => {
    const onPress = jest.fn();
    await render(<NewFolderButton onPress={onPress} />);
    fireEvent.press(screen.getByText("새 폴더 추가"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
