// client.ts 는 import 시 EXPO_PUBLIC_API_BASE_URL 를 요구하므로 apiClient 만 mock 하고
// 에러 유틸(ApiError·isApiError)은 실제 구현을 쓴다.
jest.mock("@shared/api", () => {
  const errors = jest.requireActual("@shared/api/errors");
  return {
    apiClient: {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    },
    ...errors,
  };
});

import { ApiError, apiClient } from "@shared/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import type { AxiosResponse } from "axios";
import { createElement, type ReactNode } from "react";

import { FOLDER_ERROR_CODE } from "./folder.errors";
import {
  folderListResponseSchema,
  folderQueries,
  toReorderRequest,
  useCreateFolderMutation,
  useDeleteFolderMutation,
  useReorderFoldersMutation,
  useUpdateFolderMutation,
} from "./folder.queries";

describe("folderListResponseSchema", () => {
  const validResponse = {
    systemFolders: {
      all: { linkCount: 10 },
      uncategorized: { linkCount: 2 },
      favorite: { linkCount: 0 },
      recentlyDeleted: { linkCount: 1 },
    },
    folders: [
      {
        folderId: 3,
        folderName: "디자인",
        color: "#61a8ef",
        linkCount: 5,
        lastSavedAt: null,
      },
    ],
  };

  it("정상 응답을 통과시킨다", () => {
    expect(folderListResponseSchema.safeParse(validResponse).success).toBe(
      true,
    );
  });

  it("폴더가 없는 응답을 통과시킨다", () => {
    expect(
      folderListResponseSchema.safeParse({ ...validResponse, folders: [] })
        .success,
    ).toBe(true);
  });

  // 서버가 필드를 추가해도 캐시에 그대로 남겨야 응답을 통째로 다시 받지 않고 쓸 수 있다.
  it("계약에 없는 키를 버리지 않고 통과시킨다", () => {
    const parsed = folderListResponseSchema.parse({
      ...validResponse,
      folders: [{ ...validResponse.folders[0], emoji: "🗂️" }],
    });

    expect(parsed.folders[0]).toHaveProperty("emoji", "🗂️");
  });

  it("systemFolders 키가 빠지면 거부한다", () => {
    const { favorite: _omitted, ...partial } = validResponse.systemFolders;
    expect(
      folderListResponseSchema.safeParse({
        ...validResponse,
        systemFolders: partial,
      }).success,
    ).toBe(false);
  });

  it("필드 타입이 계약과 다르면 거부한다", () => {
    expect(
      folderListResponseSchema.safeParse({
        ...validResponse,
        folders: [{ ...validResponse.folders[0], linkCount: "5" }],
      }).success,
    ).toBe(false);
  });
});

describe("toReorderRequest", () => {
  // 서버는 folderId 를 number 로 받는데 UI 모델의 id 는 문자열이라 되돌려야 한다.
  it("폴더 id 순서를 folderIds 요청 본문으로 변환한다", () => {
    expect(toReorderRequest(["4", "2", "3"])).toEqual({ folderIds: [4, 2, 3] });
  });
});

describe("useReorderFoldersMutation", () => {
  const mockPut = apiClient.put as jest.Mock;

  const orderMismatchError = new ApiError({
    status: 400,
    data: {
      success: false,
      error: {
        code: 400,
        errorCode: FOLDER_ERROR_CODE.ORDER_MISMATCH,
        message: "폴더 순서 목록이 현재 폴더 전체와 일치하지 않습니다.",
        timestamp: "2026-07-26T00:00:00.000Z",
      },
    },
  } as unknown as AxiosResponse);

  const renderReorder = async () => {
    const queryClient = new QueryClient({
      // gcTime 기본값(5분) 타이머가 남으면 jest worker 가 바로 종료되지 않는다.
      defaultOptions: { mutations: { retry: false, gcTime: 0 } },
    });
    const invalidate = jest.spyOn(queryClient, "invalidateQueries");
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);
    const { result } = await renderHook(() => useReorderFoldersMutation(), {
      wrapper,
    });
    return { result, invalidate };
  };

  beforeEach(() => {
    mockPut.mockReset();
    mockPut.mockResolvedValue({ data: { success: true, data: null } });
  });

  it("성공하면 폴더 목록을 재조회한다", async () => {
    const { result, invalidate } = await renderReorder();
    result.current.mutate(["4", "2"]);

    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: folderQueries.keys.root(),
      }),
    );
  });

  // 재조회가 끝나기 전에 mutation 이 끝나면 화면이 로컬 순서를 먼저 버려
  // 낡은 서버 순서가 잠깐 보였다가 다시 튄다.
  it("재조회가 끝난 뒤에 mutation 을 끝낸다", async () => {
    const { result, invalidate } = await renderReorder();
    const steps: string[] = [];
    // 다음 매크로태스크에서 끝나게 해 "기다리지 않으면 순서가 뒤집히는" 상황을 만든다.
    invalidate.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          setImmediate(() => {
            steps.push("재조회");
            resolve();
          });
        }),
    );

    result.current.mutate(["4", "2"], {
      onSettled: () => steps.push("완료"),
    });

    await waitFor(() => expect(steps).toEqual(["재조회", "완료"]));
  });

  // 목록이 서버와 어긋나 실패한 경우, 재조회하지 않으면 같은 목록으로 계속 같은 실패가 난다.
  it("순서 불일치로 실패하면 폴더 목록을 재조회한다", async () => {
    mockPut.mockRejectedValue(orderMismatchError);
    const { result, invalidate } = await renderReorder();
    result.current.mutate(["4", "2"]);

    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: folderQueries.keys.root(),
      }),
    );
  });

  it("그 밖의 실패에는 재조회하지 않는다", async () => {
    mockPut.mockRejectedValue(new Error("network"));
    const { result, invalidate } = await renderReorder();
    result.current.mutate(["4", "2"]);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(invalidate).not.toHaveBeenCalled();
  });
});

// 폴더 CRUD 뒤 낡는 캐시: 폴더 목록 · 홈 키워드(폴더별 링크 수·이름) · 링크 상세(소속 폴더 이름) ·
// 삭제 시엔 링크 목록(폴더의 링크가 미분류로 옮겨진다).
describe("폴더 생성·수정·삭제 캐시 무효화", () => {
  const mockPost = apiClient.post as jest.Mock;
  const mockPatch = apiClient.patch as jest.Mock;
  const mockDelete = apiClient.delete as jest.Mock;

  const renderMutation = async <T>(useMutationHook: () => T) => {
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false, gcTime: 0 } },
    });
    const invalidate = jest.spyOn(queryClient, "invalidateQueries");
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);
    const { result } = await renderHook(useMutationHook, { wrapper });
    return { result, invalidate };
  };

  const invalidatedKeys = (invalidate: jest.SpyInstance) =>
    invalidate.mock.calls.map(([options]) => options?.queryKey);

  beforeEach(() => {
    mockPost.mockReset().mockResolvedValue({
      data: {
        success: true,
        data: { folderId: 9, folderName: "새", color: "#d5d76a" },
      },
    });
    mockPatch.mockReset().mockResolvedValue({ data: { success: true } });
    mockDelete.mockReset().mockResolvedValue({ data: { success: true } });
  });

  it("생성하면 폴더 목록과 홈 키워드 캐시를 버린다", async () => {
    const { result, invalidate } = await renderMutation(
      useCreateFolderMutation,
    );
    result.current.mutate({ folderName: "새", color: "yellow-green" });

    await waitFor(() =>
      expect(invalidatedKeys(invalidate)).toEqual(
        expect.arrayContaining([["folder"], ["recommendation"]]),
      ),
    );
  });

  it("수정하면 폴더 목록·홈 키워드에 더해 링크 상세 캐시도 버린다(상세의 폴더 이름)", async () => {
    const { result, invalidate } = await renderMutation(
      useUpdateFolderMutation,
    );
    result.current.mutate({ folderId: "3", folderName: "바뀐 이름" });

    await waitFor(() =>
      expect(invalidatedKeys(invalidate)).toEqual(
        expect.arrayContaining([
          ["folder"],
          ["recommendation"],
          ["link", "detail"],
        ]),
      ),
    );
  });

  it("삭제하면 폴더 목록·홈 키워드·링크 목록·링크 상세 캐시를 버린다", async () => {
    const { result, invalidate } = await renderMutation(
      useDeleteFolderMutation,
    );
    result.current.mutate("3");

    await waitFor(() =>
      expect(invalidatedKeys(invalidate)).toEqual(
        expect.arrayContaining([
          ["folder"],
          ["recommendation"],
          ["link", "list"],
          ["link", "detail"],
        ]),
      ),
    );
  });
});
