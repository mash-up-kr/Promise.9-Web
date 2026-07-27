import { apiClient, type SuccessResponse } from "@shared/api";
import type { Link } from "@shared/types/link.types";
import { queryOptions } from "@tanstack/react-query";

// GET /links 목록 아이템 — title·source 는 OG 미수집 시 null 일 수 있다.
interface LinkListItem {
  linkId: number;
  title: string | null;
  source: string | null;
  representativeTag: Link["representativeTag"];
  thumbnailUrl: string | null;
  savedAt: string;
}

interface LinkListResponse {
  links: LinkListItem[];
  pagination: {
    nextCursor: string | null;
    hasNext: boolean;
    limit: number;
  };
}

type LinkListParams = Record<string, string | number | boolean>;

/** 보관함 라우트 id → GET /links 필터. 숫자 id 는 사용자 폴더(folderId)로 취급한다. */
export function toLinkListParams(folderId: string): LinkListParams {
  switch (folderId) {
    case "all":
      return {};
    case "uncategorized":
      return { unassigned: true };
    case "favorites":
      return { favorite: true };
    case "trash":
      return { deleted: true };
    default:
      return { folderId: Number(folderId) };
  }
}

/** 서버 링크 아이템 → UI Link. nullable 한 title·source 는 빈 문자열로 폴백한다. */
export function toLink(item: LinkListItem): Link {
  return {
    linkId: item.linkId,
    title: item.title ?? "",
    source: item.source ?? "",
    thumbnailUrl: item.thumbnailUrl,
    savedAt: item.savedAt,
    representativeTag: item.representativeTag,
  };
}

const folderLinkKeys = {
  root: () => ["folder-links"] as const,
  list: (folderId: string) => [...folderLinkKeys.root(), folderId] as const,
};

export const folderLinkQueries = {
  keys: folderLinkKeys,
  // 폴더(시스템/사용자) 내 링크 목록. 페이지네이션은 후속 — 우선 첫 페이지만 표시한다.
  list: (folderId: string) =>
    queryOptions({
      queryKey: folderLinkKeys.list(folderId),
      queryFn: async ({ signal }) => {
        const { data } = await apiClient.get<SuccessResponse<LinkListResponse>>(
          "/links",
          { params: toLinkListParams(folderId), signal },
        );

        return data.data.links.map(toLink);
      },
    }),
};
