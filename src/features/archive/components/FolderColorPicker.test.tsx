import { fireEvent, render, screen } from "@testing-library/react-native";

import { FOLDER_COLOR_OPTIONS } from "../archive.constants";
import { FolderColorPicker } from "./FolderColorPicker";

describe("FolderColorPicker", () => {
  test("모든 색상 옵션을 렌더한다", async () => {
    await render(<FolderColorPicker value="blue" onChange={jest.fn()} />);
    for (const color of FOLDER_COLOR_OPTIONS) {
      expect(screen.getByTestId(`folder-color-${color}`)).toBeOnTheScreen();
    }
  });

  test("선택된 색상만 selected 상태로 표시한다", async () => {
    await render(<FolderColorPicker value="blue" onChange={jest.fn()} />);
    expect(
      screen.getByTestId("folder-color-blue").props.accessibilityState.selected,
    ).toBe(true);
    expect(
      screen.getByTestId("folder-color-red").props.accessibilityState.selected,
    ).toBe(false);
  });

  test("색상을 누르면 해당 색상으로 onChange 를 호출한다", async () => {
    const onChange = jest.fn();
    await render(<FolderColorPicker value="blue" onChange={onChange} />);
    fireEvent.press(screen.getByTestId("folder-color-red"));
    expect(onChange).toHaveBeenCalledWith("red");
  });
});
