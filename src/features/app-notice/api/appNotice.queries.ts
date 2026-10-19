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
   * 실행당 한 번만 읽는다 — 안내는 콜드 스타트에 한 번 판단하면 되고, 실패한 조회가
   * 재시도·포커스 복귀·재연결마다 되살아나면 쓰는 중에 모달이 끼어든다.
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
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }),
};
