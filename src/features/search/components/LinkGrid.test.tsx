import type { Link } from "@shared/types/link.types";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { LinkGrid } from "./LinkGrid";

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

describe("LinkGrid", () => {
  beforeEach(() => mockPush.mockClear());

  test("모든 링크 카드를 렌더한다", async () => {
    await render(<LinkGrid links={makeLinks(4)} />);

    for (let i = 0; i < 4; i++) {
      expect(screen.getByText(`링크 ${i}`)).toBeOnTheScreen();
    }
  });

  test("링크 카드를 누르면 링크 상세로 이동한다", async () => {
    await render(<LinkGrid links={makeLinks(4)} />);

    await fireEvent.press(screen.getByLabelText("링크 2"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/link/[id]",
      params: { id: "2" },
    });
  });
});
