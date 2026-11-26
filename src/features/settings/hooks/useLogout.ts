import { clearTokens, getRefreshToken } from "@shared/api";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { takePushToken } from "@/lib/notifications";
import { sendLogout } from "@/lib/pendingLogout";

/**
 * 로그아웃 — "빠져나가기"가 목적이라 서버 실패해도 로컬 세션은 정리하고 로그인으로 보낸다.
 * (서버 RTK 삭제 실패로 사용자를 붙잡지 않는다 — plan/settings-auth-actions-followup.md 2.1)
 */
export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  // 등록 대기·서버 요청 동안 버튼이 다시 눌리지 않게 한다.
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const isRunning = useRef(false);

  const logout = useCallback(async () => {
    if (isRunning.current) return;
    isRunning.current = true;
    setIsLoggingOut(true);
    try {
      const initialRefreshToken = await getRefreshToken();
      if (initialRefreshToken) {
        const pushToken = await takePushToken();
        // 진행 중이던 등록이 리프레시 토큰을 회전시킬 수 있어 다시 읽는다. 그사이 세션이 거절돼 지워졌으면 처음 토큰으로 보낸다(서버는 만료된 토큰도 받는다).
        const refreshToken = (await getRefreshToken()) ?? initialRefreshToken;
        // 실패해도 던지지 않고 기록해 두었다가 다음 실행 때 다시 보낸다.
        await sendLogout({ refreshToken, pushToken });
      }
      await clearTokens();
      // 다음 로그인이 다른 계정일 수 있다 — 이전 계정의 화면 캐시를 남기지 않는다.
      queryClient.clear();
      router.replace("/(auth)/login");
    } finally {
      isRunning.current = false;
      setIsLoggingOut(false);
    }
  }, [queryClient, router]);

  return { logout, isPending: isLoggingOut };
}
