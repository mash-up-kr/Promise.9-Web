import { getAccessToken, refreshAccessToken } from "@shared/api";
import { useEffect, useState } from "react";

import type { AuthGateStatus } from "@/features/auth/hooks/useAuthGate";

/**
 * 익스텐션 프로세스는 매번 새로 떠서 메모리 액세스 토큰이 없다 — 그대로 두면 첫 요청들이
 * 전부 401 → refresh → 재시도를 겪는다. 저장 시트를 띄우기 전에 한 번만 재발급해 둔다.
 * 재발급 실패는 여기서 삼킨다: 401 이면 clearTokens 가 가드를 로그인 시트로 돌리고,
 * 일시 장애면 이후 요청이 평소처럼 실패 시트로 안내한다.
 */
export function useAccessTokenWarmup(status: AuthGateStatus): boolean {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") {
      setIsReady(false);
      return;
    }
    let cancelled = false;
    getAccessToken()
      .then((token) => (token ? null : refreshAccessToken()))
      .catch((error) => {
        console.error("[share] 액세스 토큰 선재발급 실패", error);
      })
      .finally(() => {
        if (!cancelled) {
          setIsReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  return isReady;
}
