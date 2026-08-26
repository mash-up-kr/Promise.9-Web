import type { LinkPreview } from "@shared/types/link.types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react-native";
import type { ReactNode } from "react";

// LinkPreviewCard → useQuery → apiClient 로드 시 client.ts throw → 통째로 목.
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

  test("로딩 중엔 스켈레톤", async () => {
    apiClient.get.mockReturnValue(new Promise(() => {}));
    await renderCard("https://bucketplace.com/x");
    expect(screen.getByTestId("link-preview-skeleton")).toBeOnTheScreen();
  });

  test("5초 경과 시 스켈레톤 해제·도메인 폴백", async () => {
    jest.useFakeTimers();
    apiClient.get.mockReturnValue(new Promise(() => {}));
    await renderCard("https://bucketplace.com/x");
    expect(screen.getByTestId("link-preview-skeleton")).toBeOnTheScreen();

    await act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(screen.queryByTestId("link-preview-skeleton")).toBeNull();
    expect(screen.getByText("bucketplace.com")).toBeOnTheScreen();
    jest.useRealTimers();
  });

  test("title null 이면 도메인, 도메인도 없으면 안내 문구", async () => {
    mockPreviewOnce({
      title: null,
      source: "bucketplace.com",
      thumbnailUrl: null,
    });
    await renderCard("https://bucketplace.com/x");
    expect(await screen.findByText("bucketplace.com")).toBeOnTheScreen();
  });

  test("title 도 도메인도 없으면 안내 문구", async () => {
    mockPreviewOnce({ title: null, source: "", thumbnailUrl: null });
    await renderCard("not-a-url");
    expect(
      await screen.findByText("제목을 불러오지 못했어요"),
    ).toBeOnTheScreen();
  });

  test("조회 실패 시 도메인 폴백 + 기본 아이콘", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    apiClient.get.mockRejectedValueOnce(new Error("500"));
    await renderCard("https://bucketplace.com/x");
    expect(await screen.findByText("bucketplace.com")).toBeOnTheScreen();
    expect(screen.getByTestId("link-preview-placeholder")).toBeOnTheScreen();
    spy.mockRestore();
  });

  test("썸네일이 있으면 이미지, 없으면 기본 아이콘", async () => {
    mockPreviewOnce(preview);
    await renderCard("https://toss.tech/x");
    expect(
      await screen.findByTestId("link-preview-thumbnail"),
    ).toBeOnTheScreen();
    expect(screen.getByText("프리뷰 제목")).toBeOnTheScreen();
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

  // 상위(CreateLinkSheet)가 다른 요소와 하나의 카드로 합쳐 보여줄 때 셸(rounded·배경)을 생략한다.
  test("isBare 이면 셸 없이 내용만 렌더한다", async () => {
    mockPreviewOnce(preview);
    await render(<LinkPreviewCard url="https://toss.tech/x" isBare />, {
      wrapper: wrapper(),
    });
    expect(await screen.findByText("프리뷰 제목")).toBeOnTheScreen();
    expect(screen.queryByTestId("link-preview-card")).toBeNull();
  });
});
