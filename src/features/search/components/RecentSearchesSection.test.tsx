import { render, screen, userEvent } from "@testing-library/react-native";

import { RecentSearchesSection } from "./RecentSearchesSection";

const keywords = ["사우나", "오늘의집", "면접"];

describe("RecentSearchesSection", () => {
  test("섹션 타이틀과 검색어 칩을 모두 렌더한다", async () => {
    await render(
      <RecentSearchesSection
        keywords={keywords}
        onPressKeyword={jest.fn()}
        onClearAll={jest.fn()}
      />,
    );

    expect(screen.getByText("최근 검색어")).toBeOnTheScreen();
    for (const keyword of keywords) {
      expect(screen.getByText(keyword)).toBeOnTheScreen();
    }
  });

  test("'모두 지우기' 를 누르면 onClearAll 을 호출한다", async () => {
    const onClearAll = jest.fn();
    await render(
      <RecentSearchesSection
        keywords={keywords}
        onPressKeyword={jest.fn()}
        onClearAll={onClearAll}
      />,
    );

    const user = userEvent.setup();
    await user.press(screen.getByRole("button", { name: "모두 지우기" }));
    expect(onClearAll).toHaveBeenCalledTimes(1);
  });

  test("검색어 칩을 누르면 해당 키워드로 onPressKeyword 를 호출한다", async () => {
    const onPressKeyword = jest.fn();
    await render(
      <RecentSearchesSection
        keywords={keywords}
        onPressKeyword={onPressKeyword}
        onClearAll={jest.fn()}
      />,
    );

    const user = userEvent.setup();
    await user.press(screen.getByRole("button", { name: "오늘의집" }));
    expect(onPressKeyword).toHaveBeenCalledWith("오늘의집");
  });

  test("검색어가 없으면 아무것도 렌더하지 않는다", async () => {
    await render(
      <RecentSearchesSection
        keywords={[]}
        onPressKeyword={jest.fn()}
        onClearAll={jest.fn()}
      />,
    );

    expect(screen.queryByText("최근 검색어")).not.toBeOnTheScreen();
  });
});
