import { render, screen, userEvent } from "@testing-library/react-native";

import type { HomeKeyword } from "../home.types";
import { KeywordSection } from "./KeywordSection";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const keywords: HomeKeyword[] = [
  { name: "운동", linkCount: 10 },
  { name: "맛집", linkCount: 8 },
  { name: "개발", linkCount: 5 },
];

describe("KeywordSection", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  test("섹션 타이틀과 키워드 칩을 보여준다", async () => {
    await render(<KeywordSection keywords={keywords} />);

    expect(screen.getByText("많이 저장한 키워드")).toBeOnTheScreen();
    for (const { name } of keywords) {
      expect(screen.getByText(name)).toBeOnTheScreen();
    }
  });

  // 시안 정책: 조건을 못 채우면 섹션 자체를 숨긴다.
  test("키워드가 없으면 아무것도 그리지 않는다", async () => {
    await render(<KeywordSection keywords={[]} />);

    expect(screen.queryByText("많이 저장한 키워드")).not.toBeOnTheScreen();
  });

  test("칩을 누르면 해당 키워드로 검색 화면에 간다", async () => {
    const user = userEvent.setup();
    await render(<KeywordSection keywords={keywords} />);

    await user.press(screen.getByRole("button", { name: "운동" }));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/search",
      params: { q: "운동" },
    });
  });
});
