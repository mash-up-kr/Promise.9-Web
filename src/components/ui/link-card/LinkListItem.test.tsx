import type { Link } from "@shared/types/link.types";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { LinkListItem } from "./LinkListItem";

const DAY_MS = 24 * 60 * 60 * 1000;

const link: Link = {
  linkId: 2,
  title: "면접 가기 전 준비해야 할 질문 3가지",
  source: "example.com",
  representativeTag: {
    tagId: 9,
    name: "커리어",
    sourceType: "user",
    sortOrder: null,
  },
  thumbnailUrl: null,
  savedAt: new Date(Date.now() - 1 * DAY_MS).toISOString(),
};

describe("LinkListItem", () => {
  test("제목·태그·저장 시기를 보여준다", async () => {
    await render(<LinkListItem link={link} />);

    expect(screen.getByText(link.title)).toBeOnTheScreen();
    expect(screen.getByText("커리어")).toBeOnTheScreen();
    expect(screen.getByText("어제")).toBeOnTheScreen();
  });

  test("제목 버튼을 누르면 onPress 를 호출한다", async () => {
    const onPress = jest.fn();
    await render(<LinkListItem link={link} onPress={onPress} />);

    fireEvent.press(screen.getByRole("button", { name: link.title }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
