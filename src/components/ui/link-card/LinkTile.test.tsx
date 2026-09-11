import type { Link } from "@shared/types/link.types";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { LinkTile } from "./LinkTile";

const DAY_MS = 24 * 60 * 60 * 1000;

const link: Link = {
  linkId: 1,
  title: "Obsidian CEO가 직접 만든 옵시디언 스킬",
  source: "example.com",
  representativeTag: {
    tagId: 3,
    name: "개발",
    sourceType: "ai",
    sortOrder: null,
  },
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

  // 홈·검색 시안은 Content Card 의 Meta 라인을 끈 인스턴스를 쓴다.
  test("showMeta 가 false 면 태그·저장 시기를 감춘다", async () => {
    await render(<LinkTile link={link} showMeta={false} />);

    expect(screen.getByText(link.title)).toBeOnTheScreen();
    expect(screen.queryByText("개발")).not.toBeOnTheScreen();
    expect(screen.queryByText("3일 전")).not.toBeOnTheScreen();
  });

  test("isSelected 면 선택 표시(체크 뱃지)를 보여준다", async () => {
    await render(<LinkTile link={link} isSelected />);
    expect(screen.getByTestId("link-tile-selected-badge")).toBeOnTheScreen();
  });

  test("기본(미선택)에는 선택 표시가 없다", async () => {
    await render(<LinkTile link={link} />);
    expect(
      screen.queryByTestId("link-tile-selected-badge"),
    ).not.toBeOnTheScreen();
  });

  // 그리드가 폭에 맞춰 카드 크기를 정한다 — 썸네일은 시안 비율(160×200)을 유지한다.
  test("width 를 주면 카드와 썸네일이 그 폭에 맞춰진다", async () => {
    await render(<LinkTile link={link} width={170} />);

    expect(screen.getByRole("button", { name: link.title })).toHaveStyle({
      width: 170,
    });
    expect(screen.getByTestId("link-card-thumbnail-placeholder")).toHaveStyle({
      width: 170,
      height: 212.5,
    });
  });

  test("제목 버튼을 누르면 onPress 를 호출한다", async () => {
    const onPress = jest.fn();
    await render(<LinkTile link={link} onPress={onPress} />);

    fireEvent.press(screen.getByRole("button", { name: link.title }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
