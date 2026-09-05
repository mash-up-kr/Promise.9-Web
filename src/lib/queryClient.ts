import { QueryClient } from "@tanstack/react-query";

// 공유 익스텐션은 마운트마다 자기 인스턴스를 만들어야 해(테스트 간 캐시 격리) 팩토리로 둔다.
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}

export const queryClient = createQueryClient();
