import type { RecommendationParams } from "./recommendation.queries";

export const recommendationKeys = {
  root: () => ["recommendation"] as const,
  list: (params: RecommendationParams) =>
    [...recommendationKeys.root(), "list", params] as const,
};
