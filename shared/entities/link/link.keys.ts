import type { LinkListParams } from "./link.queries";

// 캐시 키만 따로 둔다 — 폴더 엔티티가 "링크 목록이 낡았다"를 표현할 때 쿼리 모듈 전체를
// 가져오면 link ↔ folder 순환 import 가 생긴다(require cycle). 키 모듈은 의존이 없어 안전하다.
export const linkKeys = {
  root: () => ["link"] as const,
  preview: (url: string) => [...linkKeys.root(), "preview", url] as const,
  detail: (linkId: string) => [...linkKeys.root(), "detail", linkId] as const,
  lists: () => [...linkKeys.root(), "list"] as const,
  list: (params: LinkListParams) => [...linkKeys.lists(), params] as const,
};
