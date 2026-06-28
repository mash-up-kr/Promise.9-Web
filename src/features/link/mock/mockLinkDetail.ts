import type { Link } from "@shared/types/link";

/** Figma `link-detail` 4컷(node 5:887, 펼침/메모 입력 상태) 기준 목업 */
export const mockLinkDetail: Link = {
  id: "link-1",
  title: "신입 디자이너가 알아야 할 실험 설계 팁",
  url: "https://toss.tech/article/experiment-design-tips",
  thumbnailUrl: "https://picsum.photos/seed/link-detail-mock/335/235",
  source: "toss.tech",
  savedAt: "2026-06-19T00:00:00.000Z",
  folder: "디자인",
  tags: ["디자인", "IT", "실험 설계", "퍼널 분석", "가설 수립"],
  memo: "이 텍스트 필드는 쓰는 만큼 늘어납니다 그런데 사용자들이 과연 메모를 얼마나 쓸까요? 메모된 내용으로 검색에 도움을 받을 수 있다는 사실을 유저들이 알게 하려면 어떻게 해야 할까요?",
  aiSummary:
    "토스뱅크 인턴이 비회원 가입 전환율을 개선하는 과정에서 실험 설계와 가설 검증의 중요성을 배운 경험을 소개하는 글이에요.\n\n전환 퍼널 데이터를 분석해 우선순위를 정하고, 과거 실험 결과를 바탕으로 가설을 수립한 뒤 A/B 테스트를 진행했어요. 특히 여러 요소를 한 번에 바꾸기보다 하나의 가설만 검증하는 방식으로 실험의 원인을 명확하게 파악하려고 했어요. 초기에는 문제 정의가 모호해 원하는 결과를 얻지 못했지만, 이후 사용자 행동 데이터를 기반으로 실제 문제를 발견하고 개선해 전환율 향상이라는 성과를 만들었어요.\n\n이 글은 실험을 어떻게 설계해야 하는지, 실패한 실험에서도 어떤 인사이트를 얻을 수 있는지, 그리고 데이터 기반 의사결정이 제품 개선에 어떻게 활용되는지에 대한 힌트를 얻고 싶은 분들께 도움이 될 만한 내용이에요.",
  isFavorite: false,
};

/** 폴더 미지정(`folder` undefined) 상태 — `FolderBadge` "미분류" fallback 검증용 */
export const mockLinkDetailUnclassified: Link = {
  ...mockLinkDetail,
  id: "link-1-unclassified",
  folder: undefined,
};

/** "함께 다시 볼 링크" 캐러셀 카드 (node 5:558, 5:561, 5:564) */
export const mockRelatedLinks: Link[] = [
  {
    ...mockLinkDetail,
    id: "link-2",
    title: "신입 디자이너가 꼭 알아야 할 실험 설계 팁",
    thumbnailUrl: "https://picsum.photos/seed/related-1/120/150",
  },
  {
    ...mockLinkDetail,
    id: "link-3",
    title: "Figma Variables 정리",
    thumbnailUrl: "https://picsum.photos/seed/related-2/120/150",
  },
  {
    ...mockLinkDetail,
    id: "link-4",
    title: "사용자 인터뷰 결과를 디자인에 반영하는 방법",
    thumbnailUrl: "https://picsum.photos/seed/related-3/120/150",
  },
];
