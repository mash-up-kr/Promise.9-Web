import { fireEvent, render, screen } from "@testing-library/react-native";

import { FolderSelectItem } from "./FolderSelectItem";

describe("FolderSelectItem", () => {
  test("폴더 이름을 라디오 항목으로 보여준다", async () => {
    await render(<FolderSelectItem name="디자인" onPress={() => {}} />);

    const item = screen.getByRole("radio", { name: "디자인" });
    expect(item).toBeOnTheScreen();
    expect(item).not.toBeChecked();
  });

  test("선택된 폴더는 체크 상태로 표시한다", async () => {
    await render(
      <FolderSelectItem name="개발" isSelected onPress={() => {}} />,
    );

    expect(screen.getByRole("radio", { name: "개발" })).toBeChecked();
  });

  test("누르면 onPress 를 호출한다", async () => {
    const onPress = jest.fn();
    await render(<FolderSelectItem name="AI" onPress={onPress} />);
    await fireEvent.press(screen.getByRole("radio", { name: "AI" }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
