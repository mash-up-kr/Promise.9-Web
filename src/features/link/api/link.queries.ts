import { apiClient, type SuccessResponse } from "@shared/api";
import type { LinkPreview } from "@shared/types/link.types";
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { folderQueries } from "@/features/archive/api/folder.queries";
import { folderLinkQueries } from "@/features/archive/api/folder-links.queries";

import type { RemindType } from "../link.constants";

const linkKeys = {
  root: () => ["link"] as const,
  preview: (url: string) => [...linkKeys.root(), "preview", url] as const,
  detail: (linkId: string) => [...linkKeys.root(), "detail", linkId] as const,
};

/** 링크 상세 응답 중 화면이 쓰는 부분. 나머지 필드는 상세 화면 연동 때 넓힌다. */
export interface LinkDetail {
  linkId: number;
  url: string;
}

export const linkQueries = {
  keys: linkKeys,
  // 저장 전 OG 메타데이터. LinkPreviewCard 가 useSuspenseQuery 로 소비.
  preview: (url: string) =>
    queryOptions({
      queryKey: linkKeys.preview(url),
      queryFn: async ({ signal }) => {
        const { data } = await apiClient.get<SuccessResponse<LinkPreview>>(
          "/links/preview",
          { params: { url }, signal },
        );

        return data.data;
      },
    }),
  // 링크 상세. 목록 응답엔 원문 url 이 없어 공유·복사는 이 조회를 한 번 거친다.
  detail: (linkId: string) =>
    queryOptions({
      queryKey: linkKeys.detail(linkId),
      queryFn: async ({ signal }) => {
        const { data } = await apiClient.get<SuccessResponse<LinkDetail>>(
          `/links/${linkId}`,
          { signal },
        );

        return data.data;
      },
    }),
};

// 링크가 옮겨지거나 삭제되면 폴더별 링크 목록과 폴더 카운트가 함께 낡는다.
function useInvalidateFolderCaches() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: folderLinkQueries.keys.root() });
    queryClient.invalidateQueries({ queryKey: folderQueries.keys.root() });
  };
}

export interface UpdateLinkFolderVariables {
  linkId: number;
  /** null 은 미분류로 이동한다는 뜻(서버 계약). */
  folderId: number | null;
}

// PATCH /links/{linkId} — 링크를 다른 폴더로 옮긴다. 벌크 API 가 없어 호출부가 선택 개수만큼 부른다.
export function useUpdateLinkFolderMutation() {
  const invalidateFolderCaches = useInvalidateFolderCaches();

  return useMutation({
    mutationFn: async ({ linkId, folderId }: UpdateLinkFolderVariables) => {
      await apiClient.patch(`/links/${linkId}`, { folderId });
    },
    onSuccess: invalidateFolderCaches,
  });
}

// POST /links/{linkId}/restore — 최근 삭제된 링크를 미분류로 되돌린다.
export function useRestoreLinkMutation() {
  const invalidateFolderCaches = useInvalidateFolderCaches();

  return useMutation({
    mutationFn: async (linkId: number) => {
      await apiClient.post(`/links/${linkId}/restore`);
    },
    onSuccess: invalidateFolderCaches,
  });
}

// DELETE /links/{linkId} — soft delete 라 링크는 "최근 삭제된 링크" 폴더로 옮겨간다.
export function useDeleteLinkMutation() {
  const invalidateFolderCaches = useInvalidateFolderCaches();

  return useMutation({
    mutationFn: async (linkId: number) => {
      await apiClient.delete(`/links/${linkId}`);
    },
    onSuccess: invalidateFolderCaches,
  });
}

export interface CreateLinkPayload {
  url: string;
  // 저장 시트엔 폴더 선택이 없어 항상 null — 폴더 지정은 링크 상세(PATCH)에서.
  folderId: number | null;
  memo: string | null;
  remindType: RemindType;
}

interface CreatedLink {
  linkId: number;
  url: string;
  savedAt: string;
}

// POST /links — URL 을 먼저 저장하고 메타·요약·태그·연관링크는 서버가 비동기 처리한다.
export function useCreateLinkMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateLinkPayload) => {
      const { data } = await apiClient.post<SuccessResponse<CreatedLink>>(
        "/links",
        payload,
      );

      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: linkKeys.root() });
    },
  });
}
