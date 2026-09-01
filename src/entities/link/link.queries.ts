import { apiClient, type SuccessResponse } from "@shared/api";
import { hexToFolderTone } from "@shared/folder/folder.constants";
import type { Link, LinkDetail, LinkPreview } from "@shared/types/link.types";
import {
  infiniteQueryOptions,
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { z } from "zod";

import { folderKeys } from "@/entities/folder/folder.keys";

import { linkKeys } from "./link.keys";

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
  // 홈 "다시 볼 링크" 가 알림 날짜 배지로 쓴다. 설정하지 않았으면 null.
  reminderAt: z.string().nullable(),
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
export type LinkListResponse = z.infer<typeof linkListResponseSchema>;

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
  /** true 면 리마인드를 설정한 링크만 (지난 시각 포함). q 와 함께 쓸 수 없다. */
  reminder?: boolean;
  deleted?: boolean;
  q?: string;
  /** viewedAt·reminderAt 은 그 시각이 설정된 링크만 대상 — null 인 링크는 결과에서 빠진다. */
  sortBy?: "savedAt" | "viewedAt" | "reminderAt" | "deletedAt";
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

const relatedLinkResponseSchema = z.looseObject({
  linkId: z.number(),
  title: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
});

/** GET /links/{id} 상세 응답 스키마. looseObject 라 서버가 필드를 추가해도 통과한다. */
export const linkDetailResponseSchema = z.looseObject({
  linkId: z.number(),
  url: z.string(),
  folder: z
    // color 는 서버가 상세 응답에 담아준다(hex). 아직 안 오는 응답도 통과하도록 옵션.
    .looseObject({
      folderId: z.number(),
      folderName: z.string(),
      color: z.string().nullish(),
    })
    .nullable(),
  thumbnailUrl: z.string().nullable(),
  title: z.string().nullable(),
  source: z.string().nullable(),
  publishedAt: z.string().nullable(),
  savedAt: z.string(),
  isFavorite: z.boolean(),
  viewedAt: z.string().nullable(),
  processingStatus: z.enum(["PENDING", "SUCCESS", "NEEDS_REVIEW", "FAILED"]),
  aiSummary: z.string().nullable(),
  tags: z.array(linkTagSchema),
  memo: z.string().nullable(),
  relatedLinks: z.array(relatedLinkResponseSchema),
});

export type LinkDetailResponse = z.infer<typeof linkDetailResponseSchema>;

/** 서버 상세 응답 → UI LinkDetail. nullable title·source·relatedLink 썸네일을 빈 문자열로 폴백. */
export function toLinkDetail(item: LinkDetailResponse): LinkDetail {
  return {
    linkId: item.linkId,
    url: item.url,
    folder: item.folder
      ? { folderId: item.folder.folderId, folderName: item.folder.folderName }
      : null,
    // 서버가 준 폴더 색(hex) → UI tone. 없으면 undefined(FolderBadge 가 gray 폴백).
    folderColor: item.folder?.color
      ? hexToFolderTone(item.folder.color)
      : undefined,
    thumbnailUrl: item.thumbnailUrl,
    title: item.title ?? "",
    source: item.source ?? "",
    publishedAt: item.publishedAt,
    savedAt: item.savedAt,
    isFavorite: item.isFavorite,
    viewedAt: item.viewedAt,
    processingStatus: item.processingStatus,
    aiSummary: item.aiSummary,
    tags: item.tags,
    memo: item.memo,
    relatedLinks: item.relatedLinks.map((related) => ({
      linkId: related.linkId,
      title: related.title ?? "",
      thumbnailUrl: related.thumbnailUrl ?? "",
    })),
  };
}

// 모듈 스코프에 둬야 호출마다 같은 참조라 react-query 가 데이터가 그대로일 때 재계산을 건너뛴다.
const selectLinks = (data: LinkListResponse): Link[] => data.links.map(toLink);

/** 서버 GET /links 의 limit 최대치 — 목록 화면 페이지 크기로 쓴다. */
const LIST_PAGE_LIMIT = 30;

const selectLinkPages = (data: { pages: LinkListResponse[] }): Link[] =>
  data.pages.flatMap(selectLinks);

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
  // 단일 페이지 조회 — 홈 섹션처럼 상위 N개만 보여주는 곳이 쓴다. 목록 화면은 infiniteList.
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
  // 목록 화면(폴더 상세·전체·최근 삭제)용 커서 페이지네이션 —
  // 서버 기본 limit(9)은 홈 섹션용이라 목록은 최대치(30)로 당긴다.
  infiniteList: (params: LinkListParams) =>
    infiniteQueryOptions({
      queryKey: linkKeys.infiniteList(params),
      queryFn: async ({ pageParam, signal }) => {
        const { data } = await apiClient.get<SuccessResponse<unknown>>(
          "/links",
          {
            params: {
              ...params,
              limit: LIST_PAGE_LIMIT,
              cursor: pageParam || undefined,
            },
            signal,
          },
        );

        return linkListResponseSchema.parse(data.data);
      },
      initialPageParam: "",
      getNextPageParam: (lastPage) =>
        lastPage.pagination.hasNext
          ? (lastPage.pagination.nextCursor ?? undefined)
          : undefined,
      select: selectLinkPages,
    }),
  // 링크 상세. queryFn 이 서버 응답을 검증·매핑해 UI LinkDetail 을 반환한다.
  detail: (linkId: string) =>
    queryOptions({
      queryKey: linkKeys.detail(linkId),
      queryFn: async ({ signal }) => {
        const { data } = await apiClient.get<SuccessResponse<unknown>>(
          `/links/${linkId}`,
          { signal },
        );

        return toLinkDetail(linkDetailResponseSchema.parse(data.data));
      },
    }),
};

export interface CreateLinkPayload {
  url: string;
  folderId: number | null;
  memo: string | null;
  reminderAt: string | null;
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
      // 폴더 칩·목록의 linkCount 도 저장 직후 갱신돼야 한다.
      queryClient.invalidateQueries({ queryKey: folderKeys.root() });
    },
  });
}

// 링크가 옮겨지거나 삭제되면 링크 목록과 폴더 카운트가 함께 낡는다.
function useInvalidateFolderCaches() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: linkKeys.lists() });
    queryClient.invalidateQueries({ queryKey: folderKeys.root() });
  };
}

export interface UpdateLinkFolderVariables {
  linkId: number;
  /** null 은 미분류로 이동한다는 뜻(서버 계약). */
  folderId: number | null;
}

// PATCH /links/{linkId} — 링크를 다른 폴더로 옮긴다. 벌크 API 가 없어 호출부가 선택 개수만큼 부른다.
export function useUpdateLinkFolderMutation() {
  const queryClient = useQueryClient();
  const invalidateFolderCaches = useInvalidateFolderCaches();

  return useMutation({
    mutationFn: async ({ linkId, folderId }: UpdateLinkFolderVariables) => {
      await apiClient.patch(`/links/${linkId}`, { folderId });
    },
    // 상세 화면이 열려 있으면 폴더가 바로 바뀌도록 그 링크의 detail 도 무효화한다.
    onSuccess: (_data, { linkId }) => {
      queryClient.invalidateQueries({
        queryKey: linkKeys.detail(String(linkId)),
      });
      invalidateFolderCaches();
    },
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

export interface UpdateLinkVariables {
  linkId: number;
  /** null 은 미분류로 이동. */
  folderId?: number | null;
  memo?: string;
  isFavorite?: boolean;
}

// PATCH /links/{linkId} — folder·memo·isFavorite 중 전달된 필드만 변경한다(상세 화면 저장용).
export function useUpdateLinkMutation() {
  const queryClient = useQueryClient();
  const invalidateFolderCaches = useInvalidateFolderCaches();

  return useMutation({
    mutationFn: async ({ linkId, ...body }: UpdateLinkVariables) => {
      await apiClient.patch(`/links/${linkId}`, body);
    },
    onSuccess: (_data, { linkId }) => {
      queryClient.invalidateQueries({
        queryKey: linkKeys.detail(String(linkId)),
      });
      invalidateFolderCaches();
    },
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
