import type { Link } from "@shared/types/link.type";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { LinkTile } from "./LinkTile";

const DAY_MS = 24 * 60 * 60 * 1000;

const link: Link = {
  id: 1,
  title: "Obsidian CEO가 직접 만든 옵시디언 스킬",
  source: "example.com",
  representativeTag: { id: 3, name: "개발", sourceType: "ai", sortOrder: null },
  thumbnailUrl: null,
  savedAt: new Date(Date.now() - 3 * DAY_MS).toISOString(),
};

describe("LinkTile", () => {
  test("제목·태그·저장 시기를 보여준다", async () => {
    await render(<LinkTile link={link} />);

    expect(screen.getByText(link.title)).toBeOnTheScreen();
    expect(screen.getByText("개발")).toBeOnTheScreen();
    expect(screen.getByText("3일 전")).toBeOnTheScreen();
  });

  test("제목 버튼을 누르면 onPress 를 호출한다", async () => {
    const onPress = jest.fn();
    await render(<LinkTile link={link} onPress={onPress} />);

    fireEvent.press(screen.getByRole("button", { name: link.title }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
