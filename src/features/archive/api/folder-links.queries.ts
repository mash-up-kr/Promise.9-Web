import { apiClient, type SuccessResponse } from "@shared/api";
import type { Link } from "@shared/types/link.types";
import { queryOptions } from "@tanstack/react-query";

import { SYSTEM_FOLDERS } from "../archive.constants";

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

/**
 * 보관함 라우트 id 가 조회 가능한 폴더를 가리키는지.
 *
 * 딥링크·오타 URL(`/archive/foo`)로 들어오면 `Number(id)` 가 NaN 이 되어 그대로 서버로
 * 새어나가므로, 요청 전에 시스템 폴더 키이거나 양의 정수인지 확인한다.
 */
export function isFolderRouteId(id: string | undefined): id is string {
  if (!id) return false;
  if (SYSTEM_FOLDERS.some((folder) => folder.id === id)) return true;
  return /^[1-9]\d*$/.test(id);
}

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
