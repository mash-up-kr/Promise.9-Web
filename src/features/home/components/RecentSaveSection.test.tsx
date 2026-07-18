import type { Link } from "@shared/types/link.types";
import { render, screen } from "@testing-library/react-native";

import { RecentSaveSection } from "./RecentSaveSection";

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
  test("섹션 타이틀 '최근 저장' 을 보여준다", async () => {
    await render(<RecentSaveSection links={makeLinks(1)} />);
    expect(screen.getByText("최근 저장")).toBeOnTheScreen();
  });

  test("한 페이지(3개)를 넘는 링크도 모두 렌더한다", async () => {
    await render(<RecentSaveSection links={makeLinks(5)} />);
    for (let i = 0; i < 5; i++) {
      expect(screen.getByText(`링크 ${i}`)).toBeOnTheScreen();
    }
  });
});
