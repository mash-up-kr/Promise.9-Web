import type { Link } from "@shared/types/link.types";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { RecentLinksSection } from "./RecentLinksSection";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ push: mockPush }) }));

function makeLinks(count: number): Link[] {
  return Array.from({ length: count }, (_, i) => ({
    linkId: i,
    title: `링크 ${i}`,
    source: "example.com",
    representativeTag: null,
    thumbnailUrl: null,
    savedAt: new Date().toISOString(),
  }));
}

describe("RecentLinksSection", () => {
  beforeEach(() => mockPush.mockClear());

  test("링크 카드를 누르면 링크 상세로 이동한다", async () => {
    await render(<RecentLinksSection links={makeLinks(3)} />);

    await fireEvent.press(screen.getByLabelText("링크 1"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/link/[id]",
      params: { id: "1" },
    });
  });

  test("섹션 타이틀과 링크 카드를 모두 렌더한다", async () => {
    await render(<RecentLinksSection links={makeLinks(3)} />);

    expect(screen.getByText("최근 본 링크")).toBeOnTheScreen();
    for (let i = 0; i < 3; i++) {
      expect(screen.getByText(`링크 ${i}`)).toBeOnTheScreen();
    }
  });

  test("링크가 없으면 아무것도 렌더하지 않는다", async () => {
    await render(<RecentLinksSection links={[]} />);

    expect(screen.queryByText("최근 본 링크")).not.toBeOnTheScreen();
  });
});
