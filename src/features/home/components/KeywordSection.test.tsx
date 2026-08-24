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

  // 시안 정책은 "한 줄 6개" — 줄당 상한이지 균등 분할이 아니다.
  test("6개 이하면 한 줄로 둔다", async () => {
    await render(<KeywordSection keywords={keywords} />);

    expect(screen.getAllByTestId("keyword-row")).toHaveLength(1);
  });

  test("6개를 넘으면 첫 줄을 6개로 채우고 둘째 줄로 넘긴다", async () => {
    const many = Array.from({ length: 7 }, (_, index) => ({
      name: `태그 ${index}`,
      linkCount: 10 - index,
    }));

    await render(<KeywordSection keywords={many} />);

    expect(screen.getAllByTestId("keyword-row")).toHaveLength(2);
    expect(screen.getByText("태그 6")).toBeOnTheScreen();
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
