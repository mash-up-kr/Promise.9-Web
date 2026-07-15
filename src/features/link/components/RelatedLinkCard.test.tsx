import type { RelatedLink } from "@shared/types/link.types";
import { render, screen } from "@testing-library/react-native";
import { Image } from "react-native";

import { RelatedLinkCard } from "./RelatedLinkCard";

const baseLink: RelatedLink = {
  linkId: 1,
  title: "테스트 링크 제목",
  thumbnailUrl: "https://picsum.photos/seed/test/120/150",
};

function mockGetSize(width: number, height: number) {
  jest
    .spyOn(Image, "getSize")
    .mockImplementation((_uri, success) => success(width, height));
}

function mockGetSizeError() {
  jest
    .spyOn(Image, "getSize")
    .mockImplementation((_uri, _success, failure) =>
      failure?.(new Error("getSize 실패")),
    );
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe("RelatedLinkCard", () => {
  test("제목을 렌더한다", async () => {
    mockGetSize(120, 150);
    await render(<RelatedLinkCard link={baseLink} />);
    expect(screen.getByText(baseLink.title)).toBeOnTheScreen();
  });

  test("세로형 이미지(w < h)면 블러 레이어 없이 단일 이미지만 렌더된다", async () => {
    mockGetSize(120, 150);
    await render(<RelatedLinkCard link={baseLink} />);
    expect(await screen.findByTestId("related-thumb-image")).toBeOnTheScreen();
    expect(screen.queryByTestId("related-thumb-blur")).toBeNull();
  });

  test("가로형 이미지(w > h)면 블러 배경 + 전경 이미지가 함께 렌더된다", async () => {
    mockGetSize(300, 150);
    await render(<RelatedLinkCard link={baseLink} />);
    expect(await screen.findByTestId("related-thumb-blur")).toBeOnTheScreen();
    expect(screen.getByTestId("related-thumb-image")).toBeOnTheScreen();
  });

  test("정사각 이미지(w === h)면 세로형과 동일하게 블러 레이어 없이 렌더된다", async () => {
    mockGetSize(150, 150);
    await render(<RelatedLinkCard link={baseLink} />);
    expect(await screen.findByTestId("related-thumb-image")).toBeOnTheScreen();
    expect(screen.queryByTestId("related-thumb-blur")).toBeNull();
  });

  test("getSize 가 실패해도 크래시 없이 세로형으로 렌더된다", async () => {
    mockGetSizeError();
    await render(<RelatedLinkCard link={baseLink} />);
    expect(await screen.findByTestId("related-thumb-image")).toBeOnTheScreen();
    expect(screen.queryByTestId("related-thumb-blur")).toBeNull();
  });
});
