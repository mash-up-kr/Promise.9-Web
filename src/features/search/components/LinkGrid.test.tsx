import type { Link } from "@shared/types/link.types";
import { render, screen } from "@testing-library/react-native";

import { LinkGrid } from "./LinkGrid";

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
  test("모든 링크 카드를 렌더한다", async () => {
    await render(<LinkGrid links={makeLinks(4)} />);

    for (let i = 0; i < 4; i++) {
      expect(screen.getByText(`링크 ${i}`)).toBeOnTheScreen();
    }
  });
});
