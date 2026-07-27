import type { Link } from "@shared/types/link.types";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { RecentSaveSection } from "./RecentSaveSection";

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

describe("RecentSaveSection", () => {
  beforeEach(() => mockPush.mockClear());

  test("섹션 타이틀 '최근 저장' 을 보여준다", async () => {
    await render(<RecentSaveSection links={makeLinks(1)} />);
    expect(screen.getByText("최근 저장")).toBeOnTheScreen();
  });

  test("'최근 저장' 헤더를 누르면 전체 보관함(archive/all)으로 이동한다", async () => {
    await render(<RecentSaveSection links={makeLinks(1)} />);
    await fireEvent.press(screen.getByLabelText("최근 저장 전체 보기"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/archive/[id]",
      params: { id: "all" },
    });
  });

  test("링크 카드를 누르면 링크 상세로 이동한다", async () => {
    await render(<RecentSaveSection links={makeLinks(1)} />);
    await fireEvent.press(screen.getByLabelText("링크 0"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/link/[id]",
      params: { id: "0" },
    });
  });

  test("한 페이지(3개)를 넘는 링크도 모두 렌더한다", async () => {
    await render(<RecentSaveSection links={makeLinks(5)} />);
    for (let i = 0; i < 5; i++) {
      expect(screen.getByText(`링크 ${i}`)).toBeOnTheScreen();
    }
  });
});
