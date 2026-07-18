import type { Link } from "@shared/types/link.types";
import { render, screen } from "@testing-library/react-native";

import { RecentLinksSection } from "./RecentLinksSection";

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
