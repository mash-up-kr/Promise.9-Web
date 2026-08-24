import { render, screen, userEvent } from "@testing-library/react-native";

import type { RemindLink } from "../home.types";
import { RemindSection } from "./RemindSection";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const links: RemindLink[] = [
  {
    linkId: 1,
    title: "무조건 행복해지는 인생 치트키 사우나",
    source: "example.com",
    representativeTag: null,
    thumbnailUrl: null,
    savedAt: "2026-08-01T00:00:00.000Z",
    reminderAt: "2026-08-10T00:00:00.000Z",
  },
];

describe("RemindSection", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  test("섹션 타이틀과 링크, 알림 날짜 배지를 보여준다", async () => {
    await render(<RemindSection links={links} />);

    expect(screen.getByText("다시 볼 링크")).toBeOnTheScreen();
    expect(
      screen.getByText("무조건 행복해지는 인생 치트키 사우나"),
    ).toBeOnTheScreen();
    expect(screen.getByText("8월 10일")).toBeOnTheScreen();
  });

  // 시안 정책: 알림을 설정한 링크가 없으면 섹션 자체를 숨긴다.
  test("링크가 없으면 아무것도 그리지 않는다", async () => {
    await render(<RemindSection links={[]} />);

    expect(screen.queryByText("다시 볼 링크")).not.toBeOnTheScreen();
  });

  test("카드를 누르면 링크 상세로 이동한다", async () => {
    const user = userEvent.setup();
    await render(<RemindSection links={links} />);

    await user.press(
      screen.getByRole("button", {
        name: "무조건 행복해지는 인생 치트키 사우나",
      }),
    );

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/link/[id]",
      params: { id: "1" },
    });
  });
});
