import { queryOptions } from "@tanstack/react-query";

import { APP_RELEASE_MANIFEST_URL } from "../appNotice.constants";
import { appReleaseSchema } from "../appNotice.contracts";

const appNoticeKeys = {
  root: () => ["appNotice"] as const,
  release: () => [...appNoticeKeys.root(), "release"] as const,
};

export const appNoticeQueries = {
  keys: appNoticeKeys,
  /**
   * 업데이트 기준(최신·필수 버전). 서버 API 가 아니라 웹에 올려둔 정적 파일이라
   * apiClient(baseURL·토큰·에러 매핑)를 타지 않고 fetch 로 직접 읽는다.
   *
   * 실행당 한 번만 읽는다(`staleTime: Infinity`) — 안내는 콜드 스타트에 한 번 판단하면 되고,
   * 포커스 복귀마다 다시 묻게 두면 쓰는 중에 모달이 끼어든다.
   */
  release: () =>
    queryOptions({
      queryKey: appNoticeKeys.release(),
      queryFn: async ({ signal }) => {
        // Cloudflare 엣지와 기기 캐시를 모두 우회한다 — 기준을 바꾼 직후에도 옛 값을 받지 않도록.
        const response = await fetch(
          `${APP_RELEASE_MANIFEST_URL}?t=${Date.now()}`,
          { cache: "no-store", signal },
        );
        if (!response.ok) {
          throw new Error(
            `앱 업데이트 기준을 읽지 못했습니다 (${response.status})`,
          );
        }

        return appReleaseSchema.parse(await response.json());
      },
      staleTime: Number.POSITIVE_INFINITY,
    }),
};
