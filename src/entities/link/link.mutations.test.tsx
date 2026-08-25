jest.mock("@shared/api", () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

import { apiClient } from "@shared/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";

import {
  linkQueries,
  useDeleteLinkMutation,
  useRestoreLinkMutation,
  useUpdateLinkFolderMutation,
  useUpdateLinkMutation,
} from "./link.queries";

const mockGet = apiClient.get as jest.Mock;
const mockPatch = apiClient.patch as jest.Mock;
const mockDelete = apiClient.delete as jest.Mock;

// RNTL 14 의 renderHook 은 Promise 를 반환한다 — await 하지 않으면 result 가 비어 있다.
// gcTime 기본값(5분) 타이머가 남으면 jest worker 가 바로 종료되지 않아 0 으로 둔다.
async function renderMutation<T>(useMutationHook: () => T) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false, gcTime: 0 } },
  });
  const invalidate = jest.spyOn(queryClient, "invalidateQueries");
  const { result } = await renderHook(useMutationHook, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });

  return { result, invalidate };
}

// 링크가 다른 폴더로 가거나 삭제되면 링크 목록과 폴더 카운트가 함께 낡는다.
// 폴더별 링크 목록은 별도 캐시가 아니라 링크 목록 캐시(linkKeys.lists())의 일부다.
const expectFolderCachesInvalidated = (invalidate: jest.SpyInstance) =>
  waitFor(() =>
    expect(
      invalidate.mock.calls.map(([options]) => options?.queryKey?.[0]),
    ).toEqual(expect.arrayContaining(["link", "folder"])),
  );

describe("useUpdateLinkFolderMutation", () => {
  beforeEach(() => {
    mockPatch.mockReset().mockResolvedValue({ data: { success: true } });
  });

  it("링크의 폴더를 PATCH 로 바꾼다", async () => {
    const { result } = await renderMutation(useUpdateLinkFolderMutation);
    result.current.mutate({ linkId: 42, folderId: 3 });

    await waitFor(() =>
      expect(mockPatch).toHaveBeenCalledWith("/links/42", { folderId: 3 }),
    );
  });

  it("미분류 이동은 folderId 를 null 로 보낸다", async () => {
    const { result } = await renderMutation(useUpdateLinkFolderMutation);
    result.current.mutate({ linkId: 42, folderId: null });

    await waitFor(() =>
      expect(mockPatch).toHaveBeenCalledWith("/links/42", { folderId: null }),
    );
  });

  it("성공하면 폴더 링크 목록과 폴더 목록 캐시를 버린다", async () => {
    const { result, invalidate } = await renderMutation(
      useUpdateLinkFolderMutation,
    );
    result.current.mutate({ linkId: 42, folderId: 3 });

    await expectFolderCachesInvalidated(invalidate);
  });
});

describe("useDeleteLinkMutation", () => {
  beforeEach(() => {
    mockDelete.mockReset().mockResolvedValue({ data: { success: true } });
  });

  it("링크를 DELETE 한다", async () => {
    const { result } = await renderMutation(useDeleteLinkMutation);
    result.current.mutate(42);

    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith("/links/42"));
  });

  it("성공하면 폴더 링크 목록과 폴더 목록 캐시를 버린다", async () => {
    const { result, invalidate } = await renderMutation(useDeleteLinkMutation);
    result.current.mutate(42);

    await expectFolderCachesInvalidated(invalidate);
  });
});

describe("useRestoreLinkMutation", () => {
  const mockPost = apiClient.post as jest.Mock;

  beforeEach(() => {
    mockPost.mockReset().mockResolvedValue({ data: { success: true } });
  });

  it("삭제된 링크를 복구한다", async () => {
    const { result } = await renderMutation(useRestoreLinkMutation);
    result.current.mutate(42);

    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith("/links/42/restore"),
    );
  });

  it("성공하면 폴더 링크 목록과 폴더 목록 캐시를 버린다", async () => {
    const { result, invalidate } = await renderMutation(useRestoreLinkMutation);
    result.current.mutate(42);

    await expectFolderCachesInvalidated(invalidate);
  });
});

describe("linkQueries.detail", () => {
  it("링크 상세를 조회해 UI LinkDetail 로 매핑해 반환한다", async () => {
    mockGet.mockReset().mockResolvedValue({
      data: {
        success: true,
        data: {
          linkId: 42,
          url: "https://toss.tech",
          folder: null,
          thumbnailUrl: null,
          title: "제목",
          source: "toss.tech",
          publishedAt: null,
          savedAt: "2026-07-13T00:00:00.000Z",
          isFavorite: false,
          viewedAt: null,
          processingStatus: "SUCCESS",
          aiSummary: null,
          tags: [],
          memo: null,
          relatedLinks: [],
        },
      },
    });

    const { queryFn } = linkQueries.detail("42");
    const detail = (await (queryFn as (context: unknown) => Promise<unknown>)({
      signal: undefined,
    })) as { linkId: number; url: string; title: string };

    expect(mockGet).toHaveBeenCalledWith("/links/42", { signal: undefined });
    expect(detail.linkId).toBe(42);
    expect(detail.url).toBe("https://toss.tech");
    expect(detail.title).toBe("제목");
  });
});

describe("useUpdateLinkMutation", () => {
  beforeEach(() => {
    mockPatch.mockReset().mockResolvedValue({ data: { success: true } });
  });

  it("전달된 필드만 PATCH 로 보낸다(메모)", async () => {
    const { result } = await renderMutation(useUpdateLinkMutation);
    result.current.mutate({ linkId: 42, memo: "새 메모" });

    await waitFor(() =>
      expect(mockPatch).toHaveBeenCalledWith("/links/42", { memo: "새 메모" }),
    );
  });

  it("즐겨찾기만 보낼 수 있다", async () => {
    const { result } = await renderMutation(useUpdateLinkMutation);
    result.current.mutate({ linkId: 42, isFavorite: true });

    await waitFor(() =>
      expect(mockPatch).toHaveBeenCalledWith("/links/42", { isFavorite: true }),
    );
  });

  it("성공 시 상세·폴더 캐시를 무효화한다", async () => {
    const { result, invalidate } = await renderMutation(useUpdateLinkMutation);
    result.current.mutate({ linkId: 42, memo: "x" });

    await waitFor(() =>
      expect(
        invalidate.mock.calls.map(([options]) => options?.queryKey?.[0]),
      ).toEqual(expect.arrayContaining(["link", "folder"])),
    );
  });
});
