import { apiClient, type SuccessResponse } from "@shared/api";
import type { Link, LinkPreview } from "@shared/types/link.types";
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { z } from "zod";

import type { RemindType } from "./link.constants";

// 스키마와 shared 타입의 드리프트는 명시적 반환 타입을 가진 toLink 가 잡는다.
const linkTagSchema = z.looseObject({
  tagId: z.number(),
  name: z.string(),
  sourceType: z.enum(["user", "rule", "ai"]),
  sortOrder: z.number().nullable(),
});

// GET /links 목록 아이템 — title·source 는 OG 미수집 시 null 일 수 있다.
const linkListItemSchema = z.looseObject({
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
 * looseObject 라 모르는 키는 버리지 않고 통과시킨다 — 서버가 필드를 추가해도 깨지지 않고,
 * 캐시에 원본이 남아 그 필드를 쓸 때 스키마만 넓히면 된다(strip 이면 이미 지워져 재요청해야 한다).
 * 반대로 계약이 어긋나면(타입 불일치·필수 필드 누락) 화면에서 조용히 undefined 가 퍼지는 대신
 * queryFn 에서 바로 던져 에러 상태로 간다.
 */
export const linkListResponseSchema = z.looseObject({
  links: z.array(linkListItemSchema),
  pagination: z.looseObject({
    nextCursor: z.string().nullable(),
    hasNext: z.boolean(),
    limit: z.number(),
  }),
});

export type LinkListItem = z.infer<typeof linkListItemSchema>;
type LinkListResponse = z.infer<typeof linkListResponseSchema>;

/**
 * GET /links query 조합.
 *
 * 서버는 화면별 목록 엔드포인트를 두지 않고 최근 저장·폴더·미분류·즐겨찾기·최근 삭제·
 * 최근 본 링크·검색을 모두 이 조합으로 처리한다(docs/api/link.md). 그래서 클라이언트도
 * 목록 호출을 하나로 두고 화면 차이는 params 로만 표현한다.
 */
export interface LinkListParams {
  folderId?: number;
  unassigned?: boolean;
  favorite?: boolean;
  deleted?: boolean;
  q?: string;
  sortBy?: "savedAt" | "viewedAt" | "deletedAt";
  order?: "asc" | "desc";
  limit?: number;
  cursor?: string;
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

const linkKeys = {
  root: () => ["link"] as const,
  preview: (url: string) => [...linkKeys.root(), "preview", url] as const,
  lists: () => [...linkKeys.root(), "list"] as const,
  list: (params: LinkListParams) => [...linkKeys.lists(), params] as const,
};

// 모듈 스코프에 둬야 호출마다 같은 참조라 react-query 가 데이터가 그대로일 때 재계산을 건너뛴다.
const selectLinks = (data: LinkListResponse): Link[] => data.links.map(toLink);

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
  // 목록 조회 — 페이지네이션은 후속이라 우선 첫 페이지만 표시한다.
  list: (params: LinkListParams = {}) =>
    queryOptions({
      queryKey: linkKeys.list(params),
      // 캐시에는 검증된 서버 응답을 그대로 두고, UI 모델 변환은 select 가 맡는다.
      queryFn: async ({ signal }) => {
        const { data } = await apiClient.get<SuccessResponse<unknown>>(
          "/links",
          { params, signal },
        );

        return linkListResponseSchema.parse(data.data);
      },
      select: selectLinks,
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
