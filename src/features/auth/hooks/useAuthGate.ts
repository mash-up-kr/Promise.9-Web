import { getRefreshToken } from "@shared/api";
import { useEffect, useState } from "react";

export type AuthGateStatus = "checking" | "authenticated" | "unauthenticated";

/**
 * 보호된 화면(탭) 진입 가드 — 영속 저장된 리프레시 토큰 유무만 본다.
 *
 * 토큰이 실제로 유효한지(만료·폐기 여부)는 검사하지 않는다 — 그건 401 응답 시
 * refresh 인터셉터(shared/api/client.ts)가 재발급을 시도해 처리한다. 이 훅은
 * "한 번도 로그인한 적 없는" 콜드 스타트만 걸러 로그인 화면으로 보낸다.
 */
export function useAuthGate(): AuthGateStatus {
  const [status, setStatus] = useState<AuthGateStatus>("checking");

  useEffect(() => {
    let cancelled = false;

    getRefreshToken().then((token) => {
      if (!cancelled) {
        setStatus(token ? "authenticated" : "unauthenticated");
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}
