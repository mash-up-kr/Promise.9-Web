import { getRefreshToken, subscribeTokens } from "@shared/api";
import { useEffect, useState } from "react";

export type ExtensionSessionStatus =
  | "checking"
  | "authenticated"
  | "unauthenticated";

/**
 * 공유 익스텐션 인증 가드의 세션 상태. 인앱 useAuthGate 처럼 리프레시 토큰 유무로 판정하되,
 * 토큰 변경 구독으로 로그인 성공(setTokens)·refresh 실패(clearTokens)를 즉시 반영한다.
 */
export function useExtensionSession(): ExtensionSessionStatus {
  const [status, setStatus] = useState<ExtensionSessionStatus>("checking");

  useEffect(() => {
    let cancelled = false;
    // 조회가 겹치면 마지막 호출만 반영한다 — 늦게 끝난 이전 조회가 최신 상태를 덮어쓰지 않도록.
    let latestRequest = 0;

    const refresh = () => {
      const request = ++latestRequest;
      getRefreshToken().then((token) => {
        if (!cancelled && request === latestRequest) {
          setStatus(token ? "authenticated" : "unauthenticated");
        }
      });
    };

    refresh();
    const unsubscribe = subscribeTokens(refresh);

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return status;
}
