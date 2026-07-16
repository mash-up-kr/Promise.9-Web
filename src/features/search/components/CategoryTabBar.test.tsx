import { render, screen, userEvent } from "@testing-library/react-native";

import { CATEGORY_TABS } from "../search.constants";
import { CategoryTabBar } from "./CategoryTabBar";

describe("CategoryTabBar", () => {
  test("'전체' 와 모든 카테고리 탭을 렌더한다", async () => {
    await render(<CategoryTabBar selected="전체" onSelect={jest.fn()} />);

    for (const tab of CATEGORY_TABS) {
      expect(screen.getByText(tab)).toBeOnTheScreen();
    }
  });

  test("선택된 탭에 selected 상태를 표시한다", async () => {
    await render(<CategoryTabBar selected="디자인" onSelect={jest.fn()} />);

    expect(screen.getByRole("button", { name: "디자인" })).toBeSelected();
    expect(screen.getByRole("button", { name: "전체" })).not.toBeSelected();
  });

  test("탭을 누르면 해당 탭으로 onSelect 를 호출한다", async () => {
    const onSelect = jest.fn();
    await render(<CategoryTabBar selected="전체" onSelect={onSelect} />);

    const user = userEvent.setup();
    await user.press(screen.getByRole("button", { name: "장소" }));
    expect(onSelect).toHaveBeenCalledWith("장소");
  });
});
