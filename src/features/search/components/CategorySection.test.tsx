import { render, screen, userEvent } from "@testing-library/react-native";

import { CATEGORIES } from "../search.constants";
import { CategorySection } from "./CategorySection";

describe("CategorySection", () => {
  test("섹션 타이틀과 전체 카테고리 칩을 렌더한다", async () => {
    await render(
      <CategorySection onPressCategory={jest.fn()} onPressMore={jest.fn()} />,
    );

    expect(screen.getByText("카테고리 둘러보기")).toBeOnTheScreen();
    for (const category of CATEGORIES) {
      expect(screen.getByText(category)).toBeOnTheScreen();
    }
  });

  test("카테고리 칩을 누르면 해당 카테고리로 onPressCategory 를 호출한다", async () => {
    const onPressCategory = jest.fn();
    await render(
      <CategorySection
        onPressCategory={onPressCategory}
        onPressMore={jest.fn()}
      />,
    );

    const user = userEvent.setup();
    await user.press(screen.getByRole("button", { name: "디자인" }));
    expect(onPressCategory).toHaveBeenCalledWith("디자인");
  });

  test("타이틀 영역을 누르면 onPressMore 를 호출한다", async () => {
    const onPressMore = jest.fn();
    await render(
      <CategorySection onPressCategory={jest.fn()} onPressMore={onPressMore} />,
    );

    const user = userEvent.setup();
    await user.press(screen.getByRole("button", { name: "카테고리 둘러보기" }));
    expect(onPressMore).toHaveBeenCalledTimes(1);
  });
});
