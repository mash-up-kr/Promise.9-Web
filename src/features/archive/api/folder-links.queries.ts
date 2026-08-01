import { apiClient, type SuccessResponse } from "@shared/api";
import type { Link, LinkTag } from "@shared/types/link.types";
import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import { SYSTEM_FOLDERS } from "../archive.constants";

// satisfies 로 shared 타입과 묶어, 스키마와 인터페이스가 어긋나면 컴파일에서 잡히게 한다.
const linkTagSchema = z.object({
  tagId: z.number(),
  name: z.string(),
  sourceType: z.enum(["user", "rule", "ai"]),
  sortOrder: z.number().nullable(),
}) satisfies z.ZodType<LinkTag>;

// GET /links 목록 아이템 — title·source 는 OG 미수집 시 null 일 수 있다.
const linkListItemSchema = z.object({
  linkId: z.number(),
  title: z.string().nullable(),
  source: z.string().nullable(),
  representativeTag: linkTagSchema.nullable(),
  thumbnailUrl: z.string().nullable(),
  savedAt: z.string(),
});

/**
 * GET /links 응답 스키마.
 *
 * 모르는 키는 zod 기본 동작대로 버린다 — 서버가 필드를 추가해도 클라이언트가 깨지지 않는다.
 * 반대로 계약이 어긋나면(타입 불일치·필수 필드 누락) 화면에서 조용히 undefined 가 퍼지는 대신
 * queryFn 에서 바로 던져 에러 상태로 간다.
 */
export const linkListResponseSchema = z.object({
  links: z.array(linkListItemSchema),
  pagination: z.object({
    nextCursor: z.string().nullable(),
    hasNext: z.boolean(),
    limit: z.number(),
  }),
});

type LinkListItem = z.infer<typeof linkListItemSchema>;
type LinkListResponse = z.infer<typeof linkListResponseSchema>;

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

// 모듈 스코프에 둬야 호출마다 같은 참조라 react-query 가 데이터가 그대로일 때 재계산을 건너뛴다.
const selectLinks = (data: LinkListResponse): Link[] => data.links.map(toLink);

export const folderLinkQueries = {
  keys: folderLinkKeys,
  // 폴더(시스템/사용자) 내 링크 목록. 페이지네이션은 후속 — 우선 첫 페이지만 표시한다.
  list: (folderId: string) =>
    queryOptions({
      queryKey: folderLinkKeys.list(folderId),
      // 캐시에는 검증된 서버 응답을 그대로 두고, UI 모델 변환은 select 가 맡는다.
      queryFn: async ({ signal }) => {
        const { data } = await apiClient.get<SuccessResponse<unknown>>(
          "/links",
          { params: toLinkListParams(folderId), signal },
        );

        return linkListResponseSchema.parse(data.data);
      },
      select: selectLinks,
    }),
};
