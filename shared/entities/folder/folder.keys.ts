// 캐시 키만 따로 둔다 — 링크 엔티티가 "폴더 카운트가 낡았다"를 표현할 때 쿼리 모듈 전체를
// 가져오면 link ↔ folder 순환 import 가 생긴다(require cycle). 키 모듈은 의존이 없어 안전하다.
export const folderKeys = {
  root: () => ["folder"] as const,
  list: () => [...folderKeys.root(), "list"] as const,
};
