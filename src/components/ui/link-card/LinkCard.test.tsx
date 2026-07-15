import type { Link } from "@shared/types/link.types";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { LinkCard } from "./LinkCard";

const DAY_MS = 24 * 60 * 60 * 1000;

const link: Link = {
  id: 1,
  title: "바이브 코딩 결과물이 다 평범해 보이는 진짜 이유",
  source: "toss.tech",
  representativeTag: { id: 7, name: "AI", sourceType: "ai", sortOrder: null },
  thumbnailUrl: null,
  savedAt: new Date(Date.now() - 3 * DAY_MS).toISOString(),
};

function renderCard(overrides?: Partial<Link>, onPress?: () => void) {
  return render(
    <LinkCard.Root link={{ ...link, ...overrides }} onPress={onPress}>
      <LinkCard.Thumbnail />
      <LinkCard.Meta />
      <LinkCard.Title />
    </LinkCard.Root>,
  );
}

describe("LinkCard", () => {
  test("제목을 가진 버튼으로 렌더하고, 누르면 onPress 를 호출한다", async () => {
    const onPress = jest.fn();
    await renderCard(undefined, onPress);

    fireEvent.press(screen.getByRole("button", { name: link.title }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test("Title 은 링크 제목을 보여준다", async () => {
    await renderCard();
    expect(screen.getByText(link.title)).toBeOnTheScreen();
  });

  test("Meta 는 대표 태그와 저장 시기를 보여준다", async () => {
    await renderCard();
    expect(screen.getByText("AI")).toBeOnTheScreen();
    expect(screen.getByText("3일 전")).toBeOnTheScreen();
  });

  test("대표 태그가 없으면 저장 시기만 보여준다", async () => {
    await renderCard({ representativeTag: null });
    expect(screen.queryByText("AI")).not.toBeOnTheScreen();
    expect(screen.getByText("3일 전")).toBeOnTheScreen();
  });

  test("썸네일 URL 이 없으면 placeholder 를 렌더한다", async () => {
    await renderCard();
    expect(
      screen.getByTestId("link-card-thumbnail-placeholder"),
    ).toBeOnTheScreen();
  });

  test("썸네일 URL 이 있으면 이미지를 렌더한다", async () => {
    await renderCard({ thumbnailUrl: "https://static.example.com/t.png" });
    expect(screen.getByTestId("link-card-thumbnail-image")).toBeOnTheScreen();
  });
});
