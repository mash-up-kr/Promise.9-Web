import { apiClient, type SuccessResponse } from "@shared/api";
import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import { recommendationKeys } from "./recommendation.keys";

// 폴더·태그를 한 목록에 섞어 준다 — folderId·color(폴더)·normalizedTag(태그)는 유형별 선택 필드라
// looseObject 로 통과시키고, 화면이 쓰는 공통 필드만 계약으로 잡는다.
const recommendationItemSchema = z.looseObject({
  key: z.string(),
  type: z.enum(["folder", "tag"]),
  label: z.string(),
  linkCount: z.number(),
  lastViewedAt: z.string().nullable(),
});

/**
 * GET /recommendations 응답 스키마.
 *
 * 후보(활성 링크 3개 이상인 폴더·태그)가 2개 이하면 서버가 data 를 null 로 준다 —
 * 클라이언트가 섹션을 통째로 숨길 수 있게 한 계약이라 null 도 정상 응답이다.
 */
export const recommendationResponseSchema = z
  .looseObject({ items: z.array(recommendationItemSchema) })
  .nullable();

export type RecommendationResponse = z.infer<
  typeof recommendationResponseSchema
>;

export interface RecommendationParams {
  /** 최대 항목 수 (1~50, 서버 기본 12) */
  limit?: number;
}

export const recommendationQueries = {
  keys: recommendationKeys,
  // 자주 저장한 키워드 — 정렬(링크 많은 순)·노출 조건은 서버 정책이라 클라이언트가 다시 거르지 않는다.
  list: (params: RecommendationParams = {}) =>
    queryOptions({
      queryKey: recommendationKeys.list(params),
      queryFn: async ({ signal }) => {
        const { data } = await apiClient.get<SuccessResponse<unknown>>(
          "/recommendations",
          { params, signal },
        );

        return recommendationResponseSchema.parse(data.data);
      },
    }),
};
