import { apiClient, type SuccessResponse } from "@shared/api";
import type { Link } from "@shared/types/link.types";
import { queryOptions } from "@tanstack/react-query";

interface LinkItemsData {
  items: Link[];
}

const searchKeys = {
  root: () => ["search"] as const,
  results: (query: string) => [...searchKeys.root(), "results", query] as const,
  recentViewed: () => [...searchKeys.root(), "recent-viewed"] as const,
  recentKeywords: () => [...searchKeys.root(), "recent-keywords"] as const,
  category: (category: string) =>
    [...searchKeys.root(), "category", category] as const,
};

export const searchQueries = {
  keys: searchKeys,
  // 검색 결과 — 제목·태그·메모 매칭.
  results: (query: string) =>
    queryOptions({
      queryKey: searchKeys.results(query),
      queryFn: async ({ signal }) => {
        const { data } = await apiClient.get<SuccessResponse<LinkItemsData>>(
          "/links",
          { params: { search: query }, signal },
        );
        return data.data.items;
      },
    }),
  // 최근 본 링크 (상세 열람 시각 내림차순).
  recentViewed: () =>
    queryOptions({
      queryKey: searchKeys.recentViewed(),
      queryFn: async ({ signal }) => {
        const { data } = await apiClient.get<
          SuccessResponse<{ links: Link[] }>
        >("/links/recently-viewed", { signal });
        return data.data.links;
      },
    }),
  // 최근 검색어.
  recentKeywords: () =>
    queryOptions({
      queryKey: searchKeys.recentKeywords(),
      queryFn: async ({ signal }) => {
        const { data } = await apiClient.get<
          SuccessResponse<{ keywords: string[] }>
        >("/search/recent", { signal });
        return data.data.keywords;
      },
    }),
  // 카테고리 둘러보기 — '전체'는 파라미터 없이 전부.
  categoryLinks: (category: string) =>
    queryOptions({
      queryKey: searchKeys.category(category),
      queryFn: async ({ signal }) => {
        const params = category === "전체" ? {} : { category };
        const { data } = await apiClient.get<SuccessResponse<LinkItemsData>>(
          "/links",
          { params, signal },
        );
        return data.data.items;
      },
    }),
};
