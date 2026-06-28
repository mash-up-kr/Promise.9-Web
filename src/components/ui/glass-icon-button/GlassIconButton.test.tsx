import { fireEvent, render, screen } from "@testing-library/react-native";
import { Search } from "lucide-react-native";

import { GlassIconButton } from "./GlassIconButton";

describe("GlassIconButton", () => {
  test("label 을 가진 button 으로 렌더한다", async () => {
    await render(
      <GlassIconButton iconNode={Search} label="검색" onPress={() => {}} />,
    );
    expect(screen.getByRole("button", { name: "검색" })).toBeOnTheScreen();
  });

  test("누르면 onPress 가 호출된다", async () => {
    const onPress = jest.fn();
    await render(
      <GlassIconButton iconNode={Search} label="검색" onPress={onPress} />,
    );
    fireEvent.press(screen.getByRole("button", { name: "검색" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
