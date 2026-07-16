import type { Link } from "@shared/types/link.types";
import { render, screen, userEvent } from "@testing-library/react-native";

import { RecentLinkCard } from "./RecentLinkCard";

const link: Link = {
  linkId: 1,
  title: "Figma Variables 정리",
  source: "example.com",
  representativeTag: null,
  thumbnailUrl: null,
  savedAt: new Date().toISOString(),
};

describe("RecentLinkCard", () => {
  test("제목을 보여주고, 누르면 onPress 를 호출한다", async () => {
    const onPress = jest.fn();
    await render(<RecentLinkCard link={link} onPress={onPress} />);

    expect(screen.getByText("Figma Variables 정리")).toBeOnTheScreen();

    const user = userEvent.setup();
    await user.press(screen.getByRole("button", { name: link.title }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
