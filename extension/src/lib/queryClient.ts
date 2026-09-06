import { QueryClient } from "@tanstack/react-query";

/**
 * 익스텐션 UI 용 QueryClient.
 */
export function createExtensionQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 사이드바는 오래 열려 있고 그동안 다른 기기에서 폴더가 바뀔 수 있다 — 항상 최신을 본다.
        staleTime: 0,
        /**
         * 재시도하지 않는다. 취향이 아니라 필요 때문이다.
         *
         * `useSuspenseQuery` 로 서스펜드된 컴포넌트는 커밋되지 않아 쿼리에 옵저버가 0개다.
         * 이 상태에서 첫 요청이 실패하면 재시도가 `paused` 로 보류되고, 서스펜스를 풀어 줄
         * promise 가 영영 settle 되지 않아 화면이 스켈레톤인 채로 멈춘다(실제로 재현했다).
         * 한 번에 실패시키면 에러 경계가 '다시 시도' 를 띄우고, 재시도 여부는 사용자가 고른다.
         */
        retry: false,
        // 오프라인 판단으로 요청을 보류하지도 않는다 — 보류보다 실패를 드러내는 게 낫다.
        networkMode: "always",
      },
      mutations: { retry: false, networkMode: "always" },
    },
  });
}
