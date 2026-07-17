import { apiClient, type SuccessResponse } from "@shared/api";
import type { LinkDetail, LinkPreview } from "@shared/types/link.types";
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import type { RemindType } from "../link.constants";

const linkKeys = {
  root: () => ["link"] as const,
  preview: (url: string) => [...linkKeys.root(), "preview", url] as const,
  detail: (id: number) => [...linkKeys.root(), "detail", id] as const,
};

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
  // 링크 상세 — 조회 시 서버가 최근 본(viewedAt)에 반영한다.
  detail: (id: number) =>
    queryOptions({
      queryKey: linkKeys.detail(id),
      queryFn: async ({ signal }) => {
        const { data } = await apiClient.get<SuccessResponse<LinkDetail>>(
          `/links/${id}`,
          { signal },
        );

        return data.data;
      },
    }),
};

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

export interface UpdateLinkVariables {
  linkId: number;
  patch: {
    isFavorite?: boolean;
    memo?: string | null;
    folderId?: number | null;
    tags?: string[];
  };
}

// PATCH /links/{id} — 즐겨찾기 등 편집. 홈·보관함 카운트에도 반영되도록 전체 무효화(UT).
export function useUpdateLinkMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ linkId, patch }: UpdateLinkVariables) => {
      const { data } = await apiClient.patch<SuccessResponse<LinkDetail>>(
        `/links/${linkId}`,
        patch,
      );

      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}
