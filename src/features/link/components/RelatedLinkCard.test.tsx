import type { RelatedLink } from "@shared/types/link.types";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { RelatedLinkCard } from "./RelatedLinkCard";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const baseLink: RelatedLink = {
  linkId: 1,
  title: "테스트 링크 제목",
  thumbnailUrl: "https://picsum.photos/seed/test/120/150",
};

// expo-image 는 정적 getSize 대신 onLoad 이벤트로 실제 치수를 알려준다.
// fireEvent 는 act() 로 상태 갱신을 커밋할 때까지 기다려야 하므로 반드시 await 한다.
async function fireLoad(width: number, height: number) {
  await fireEvent(screen.getByTestId("related-thumb-image"), "load", {
    nativeEvent: {
      source: { url: baseLink.thumbnailUrl, width, height, mediaType: null },
      cacheType: "none",
    },
  });
}

describe("RelatedLinkCard", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  test("제목을 렌더한다", async () => {
    await render(<RelatedLinkCard link={baseLink} />);
    expect(screen.getByText(baseLink.title)).toBeOnTheScreen();
  });

  test("카드를 누르면 해당 링크 상세로 이동한다", async () => {
    await render(<RelatedLinkCard link={baseLink} />);
    fireEvent.press(screen.getByRole("button"));
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/link/[id]",
        params: { id: String(baseLink.linkId) },
      }),
    );
  });

  test("썸네일이 없으면(빈 문자열) 이미지를 렌더하지 않는다", async () => {
    await render(<RelatedLinkCard link={{ ...baseLink, thumbnailUrl: "" }} />);
    // 빈 URI 로 Image 를 렌더하면 웹에서 빈 <img> 테두리가 생긴다 — 아예 렌더하지 않는다.
    expect(screen.queryByTestId("related-thumb-image")).toBeNull();
    expect(screen.queryByTestId("related-thumb-blur")).toBeNull();
    // 제목은 그대로 보여야 한다.
    expect(screen.getByText(baseLink.title)).toBeOnTheScreen();
  });

  test("이미지 로드 전(치수 미확정)에는 블러 레이어 없이 단일 이미지만 렌더된다", async () => {
    await render(<RelatedLinkCard link={baseLink} />);
    expect(screen.getByTestId("related-thumb-image")).toBeOnTheScreen();
    expect(screen.queryByTestId("related-thumb-blur")).toBeNull();
  });

  test("세로형 이미지(w < h)면 블러 레이어 없이 단일 이미지만 렌더된다", async () => {
    await render(<RelatedLinkCard link={baseLink} />);
    await fireLoad(120, 150);
    expect(screen.getByTestId("related-thumb-image")).toBeOnTheScreen();
    expect(screen.queryByTestId("related-thumb-blur")).toBeNull();
  });

  test("가로형 이미지(w > h)면 블러 배경 + 전경 이미지가 함께 렌더된다", async () => {
    await render(<RelatedLinkCard link={baseLink} />);
    await fireLoad(300, 150);
    expect(screen.getByTestId("related-thumb-blur")).toBeOnTheScreen();
    expect(screen.getByTestId("related-thumb-image")).toBeOnTheScreen();
  });

  test("정사각 이미지(w === h)면 세로형과 동일하게 블러 레이어 없이 렌더된다", async () => {
    await render(<RelatedLinkCard link={baseLink} />);
    await fireLoad(150, 150);
    expect(screen.getByTestId("related-thumb-image")).toBeOnTheScreen();
    expect(screen.queryByTestId("related-thumb-blur")).toBeNull();
  });
});
