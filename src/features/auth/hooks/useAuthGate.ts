import { getRefreshToken, subscribeTokens } from "@shared/api";
import { useEffect, useState } from "react";

export type AuthGateStatus = "checking" | "authenticated" | "unauthenticated";

/**
 * 보호된 화면(탭)·공유 익스텐션 진입 가드 — 영속 저장된 리프레시 토큰 유무만 본다.
 *
 * 토큰이 실제로 유효한지(만료·폐기 여부)는 검사하지 않는다 — 그건 401 응답 시
 * refresh 인터셉터(shared/api/client.ts)가 재발급을 시도해 처리한다. 토큰 변경 구독으로
 * 로그인 성공(setTokens)·refresh 실패(clearTokens)를 즉시 반영하므로, 공유 시트에서 한
 * 로그인도 살아 있는 앱 화면에 바로 적용된다.
 */
export function useAuthGate(): AuthGateStatus {
  const [status, setStatus] = useState<AuthGateStatus>("checking");

  useEffect(() => {
    let cancelled = false;
    // 조회가 겹치면 마지막 호출만 반영한다 — 늦게 끝난 이전 조회가 최신 상태를 덮어쓰지 않도록.
    let latestRequest = 0;

    const refresh = () => {
      const request = ++latestRequest;
      getRefreshToken()
        .then((token) => {
          if (!cancelled && request === latestRequest) {
            setStatus(token ? "authenticated" : "unauthenticated");
          }
        })
        .catch((error) => {
          // 저장소 조회 실패를 "확인 중"에 묶어 두면 스플래시·시트가 영원히 비어 있다 — 로그인으로 보낸다.
          console.error("[auth] 리프레시 토큰 조회 실패", error);
          if (!cancelled && request === latestRequest) {
            setStatus("unauthenticated");
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
