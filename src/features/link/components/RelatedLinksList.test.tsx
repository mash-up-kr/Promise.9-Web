import { fireEvent, render, screen } from "@testing-library/react-native";

import { mockRelatedLinks } from "../mock/mockLinkDetail";
import { RelatedLinksList } from "./RelatedLinksList";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe("RelatedLinksList", () => {
  beforeEach(() => mockPush.mockClear());

  // 카드 내부 landscape 판정(expo-image onLoad)은 RelatedLinkCard.test.tsx 에서 별도 검증한다.

  test("섹션 타이틀 '함께 다시 볼 링크'를 렌더한다", async () => {
    await render(<RelatedLinksList items={mockRelatedLinks} />);
    expect(screen.getByText("함께 다시 볼 링크")).toBeOnTheScreen();
  });

  test("items 각 항목의 제목이 카드로 렌더된다", async () => {
    await render(<RelatedLinksList items={mockRelatedLinks} />);
    for (const item of mockRelatedLinks) {
      expect(screen.getByText(item.title)).toBeOnTheScreen();
    }
  });

  test("items 가 빈 배열이면 빈 상태 문구가 노출된다", async () => {
    await render(<RelatedLinksList items={[]} />);
    expect(screen.getByText("아직 함께 볼 링크가 없어요")).toBeOnTheScreen();
    expect(screen.getByText("링크가 쌓이면 비슷한 링크를")).toBeOnTheScreen();
    expect(screen.getByText("모아 보여드릴게요")).toBeOnTheScreen();
  });

  test("items 가 있으면 빈 상태 문구가 노출되지 않는다", async () => {
    await render(<RelatedLinksList items={mockRelatedLinks} />);
    expect(screen.queryByText("아직 함께 볼 링크가 없어요")).toBeNull();
  });

  test("카드를 누르면 해당 링크 상세로 이동한다", async () => {
    const target = mockRelatedLinks[0];
    await render(<RelatedLinksList items={mockRelatedLinks} />);
    fireEvent.press(screen.getByRole("button", { name: target.title }));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/link/[id]",
      params: { id: String(target.linkId) },
    });
  });
});
