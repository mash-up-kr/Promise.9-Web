import { apiClient, type SuccessResponse } from "@shared/api";
import type { LinkPreview } from "@shared/types/link.types";
import { queryOptions } from "@tanstack/react-query";

const linkKeys = {
  root: () => ["link"] as const,
  preview: (url: string) => [...linkKeys.root(), "preview", url] as const,
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
};
