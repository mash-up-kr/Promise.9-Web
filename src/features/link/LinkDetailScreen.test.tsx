import { render, screen, userEvent } from "@testing-library/react-native";
import { Image } from "react-native";

import { LinkDetailScreen } from "./LinkDetailScreen";
import { mockLinkDetail, mockRelatedLinks } from "./mock/mockLinkDetail";

jest.mock("expo-router", () => ({
  Stack: { Screen: () => null },
  useLocalSearchParams: () => ({ id: mockLinkDetail.id }),
}));

describe("LinkDetailScreen", () => {
  beforeEach(() => {
    jest
      .spyOn(Image, "getSize")
      .mockImplementation((_uri, success) => success(335, 235));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("제목·폴더·출처/저장일을 렌더한다", async () => {
    await render(<LinkDetailScreen />);
    expect(screen.getByText(mockLinkDetail.title)).toBeOnTheScreen();
    expect(screen.getByText("디자인")).toBeOnTheScreen();
    expect(screen.getByText("toss.tech · 2026.06.19")).toBeOnTheScreen();
  });

  test("AI 요약 섹션을 렌더한다", async () => {
    await render(<LinkDetailScreen />);
    expect(screen.getByText("AI 요약으로 미리보기")).toBeOnTheScreen();
  });

  test("태그 추가 → 화면에 새 태그 칩이 반영된다", async () => {
    const user = userEvent.setup();
    await render(<LinkDetailScreen />);
    await user.press(screen.getByRole("button", { name: "태그 추가" }));
    await user.type(
      screen.getByPlaceholderText("태그를 입력해 주세요"),
      "회고",
    );
    await user.press(screen.getByRole("button", { name: "추가" }));
    expect(screen.getByText("#회고")).toBeOnTheScreen();
  });

  test("태그 삭제 → 화면에서 해당 칩이 사라진다", async () => {
    const user = userEvent.setup();
    await render(<LinkDetailScreen />);
    await user.press(screen.getByRole("button", { name: "태그 추가" }));
    await user.press(screen.getByLabelText("IT 삭제"));
    expect(screen.queryByText("#IT")).toBeNull();
  });

  test("메모 입력값이 controlled state로 반영된다", async () => {
    const user = userEvent.setup();
    await render(<LinkDetailScreen />);
    const input = screen.getByPlaceholderText(
      "저장한 이유나 기억하고 싶은 점을 적어보세요",
    );
    await user.type(input, "!");
    expect(input.props.value).toBe(`${mockLinkDetail.memo}!`);
  });

  test("함께 다시 볼 링크 섹션에 mock 아이템이 렌더된다", async () => {
    await render(<LinkDetailScreen />);
    expect(screen.getByText("함께 다시 볼 링크")).toBeOnTheScreen();
    for (const item of mockRelatedLinks) {
      expect(screen.getByText(item.title)).toBeOnTheScreen();
    }
  });
});
