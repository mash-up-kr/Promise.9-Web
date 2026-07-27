import type { LinkPreview } from "@shared/types/link.types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react-native";
import type { ReactNode } from "react";

// LinkPreviewCard → useSuspenseQuery → apiClient 로드 시 client.ts throw → 통째로 목.
jest.mock("@shared/api", () => ({ apiClient: { get: jest.fn() } }));

import { LinkPreviewCard } from "./LinkPreviewCard";

const { apiClient } = jest.requireMock("@shared/api") as {
  apiClient: { get: jest.Mock };
};

const preview: LinkPreview = {
  title: "프리뷰 제목",
  source: "toss.tech",
  thumbnailUrl: "https://img.test/og.png",
};

// 서버 envelope { success, data } 를 흉내낸다.
function mockPreviewOnce(data: LinkPreview) {
  apiClient.get.mockResolvedValueOnce({ data: { success: true, data } });
}

function wrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

const renderCard = (url: string) =>
  render(<LinkPreviewCard url={url} />, { wrapper: wrapper() });

afterEach(() => jest.clearAllMocks());

describe("LinkPreviewCard", () => {
  test("url 이 비어 있으면 아무것도 렌더하지 않는다", async () => {
    await renderCard("");
    expect(screen.queryByTestId("link-preview-card")).toBeNull();
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  test("로딩 중이면 스켈레톤을 렌더한다", async () => {
    apiClient.get.mockReturnValue(new Promise(() => {}));
    await renderCard("https://toss.tech/x");
    expect(screen.getByTestId("link-preview-skeleton")).toBeOnTheScreen();
  });

  test("썸네일이 있으면 이미지와 제목·부제를 렌더한다", async () => {
    mockPreviewOnce(preview);
    await renderCard("https://toss.tech/x");
    expect(
      await screen.findByTestId("link-preview-thumbnail"),
    ).toBeOnTheScreen();
    expect(screen.getByText("프리뷰 제목")).toBeOnTheScreen();
    expect(screen.getByText("toss.tech")).toBeOnTheScreen();
    expect(screen.queryByTestId("link-preview-placeholder")).toBeNull();
  });

  test("썸네일이 없으면 링크 아이콘 placeholder 를 렌더한다", async () => {
    mockPreviewOnce({ ...preview, thumbnailUrl: null });
    await renderCard("https://toss.tech/x");
    expect(
      await screen.findByTestId("link-preview-placeholder"),
    ).toBeOnTheScreen();
    expect(screen.queryByTestId("link-preview-thumbnail")).toBeNull();
  });

  test("실패하면 안내 문구와 placeholder 를 렌더한다", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    apiClient.get.mockRejectedValueOnce(new Error("500"));
    await renderCard("https://toss.tech/x");
    expect(
      await screen.findByText("링크 정보를 가져오지 못했어요."),
    ).toBeOnTheScreen();
    expect(screen.getByTestId("link-preview-placeholder")).toBeOnTheScreen();
    spy.mockRestore();
  });
});
