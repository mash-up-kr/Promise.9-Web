import { fireEvent, render, screen } from "@testing-library/react-native";
import { offsetToIndex, WheelPicker } from "./WheelPicker";

const ITEMS = [
  { value: 0, label: "00" },
  { value: 15, label: "15" },
  { value: 30, label: "30" },
  { value: 45, label: "45" },
];

describe("WheelPicker", () => {
  test("offset → index 는 44 단위 반올림, 범위 클램프", () => {
    expect(offsetToIndex(0, 4)).toBe(0);
    expect(offsetToIndex(66, 4)).toBe(2);
    expect(offsetToIndex(88, 4)).toBe(2);
    expect(offsetToIndex(9999, 4)).toBe(3);
  });

  test("스크롤 멈춤 시 가장 가까운 항목으로 onChange", async () => {
    const onChange = jest.fn();
    await render(
      <WheelPicker
        items={ITEMS}
        selectedValue={0}
        onChange={onChange}
        testID="wheel"
      />,
    );
    fireEvent(screen.getByTestId("wheel"), "momentumScrollEnd", {
      nativeEvent: { contentOffset: { y: 88 } },
    });
    expect(onChange).toHaveBeenCalledWith(30);
  });

  test("모든 라벨을 렌더링한다", async () => {
    await render(
      <WheelPicker items={ITEMS} selectedValue={15} onChange={jest.fn()} />,
    );
    for (const item of ITEMS) expect(screen.getByText(item.label)).toBeTruthy();
  });
});
