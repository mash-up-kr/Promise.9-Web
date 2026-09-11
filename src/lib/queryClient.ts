import { QueryClient } from "@tanstack/react-query";

// 공유 익스텐션은 마운트마다 자기 인스턴스를 만들어야 해(테스트 간 캐시 격리) 팩토리로 둔다.
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        // 포커스 재조회는 기본값(켜짐)을 둔다 — 공유·크롬 익스텐션이나 다른 기기에서 저장한 링크는
        // 앱이 다시 포커스될 때 반영된다(네이티브 포커스 판단은 lib/focus-manager).
      },
    },
  });
}

export const queryClient = createQueryClient();
