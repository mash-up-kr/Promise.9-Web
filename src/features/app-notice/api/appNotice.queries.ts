import { queryOptions } from "@tanstack/react-query";
import axios from "axios";

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
   * apiClient(baseURL·토큰·에러 매핑)를 타지 않고 axios 로 직접 읽는다.
   *
   * 한 번 읽으면 다시 묻지 않는다(`staleTime`) — 포커스 복귀마다 권유 모달이 끼어들지 않게.
   * 실패는 몇 번 재시도하고, 그래도 못 읽었으면 재연결·포커스 복귀 때 다시 읽는다(기본값) —
   * 실행 직후 순단 한 번으로 차단 안내가 그 프로세스 내내 사라지면 안 된다.
   * 파일은 `max-age=0, must-revalidate` 로 서빙돼 기준을 바꾼 직후에도 옛 값을 받지 않는다.
   */
  release: () =>
    queryOptions({
      queryKey: appNoticeKeys.release(),
      queryFn: async ({ signal }) => {
        const { data } = await axios.get<unknown>(APP_RELEASE_MANIFEST_URL, {
          signal,
          // 응답이 없으면 기다리지 않는다 — 안내 판단이 영영 미뤄지지 않게.
          timeout: 10_000,
        });
        return appReleaseSchema.parse(data);
      },
      staleTime: Number.POSITIVE_INFINITY,
      retry: 2,
    }),
};
