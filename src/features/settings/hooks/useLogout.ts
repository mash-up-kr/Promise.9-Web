import { clearTokens, getRefreshToken } from "@shared/api";
import { useLogoutMutation } from "@shared/entities/auth/auth.queries";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { unregisterPushToken } from "@/lib/notifications";

/**
 * 로그아웃 — "빠져나가기"가 목적이라 서버 실패해도 로컬 세션은 정리하고 로그인으로 보낸다.
 * (서버 RTK 삭제 실패로 사용자를 붙잡지 않는다 — plan/settings-auth-actions-followup.md 2.1)
 */
export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { mutateAsync } = useLogoutMutation();
  // 푸시 해제를 기다리는 동안에도 버튼이 다시 눌리지 않게 mutation 보다 넓게 잡는다.
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const isRunning = useRef(false);

  const logout = useCallback(async () => {
    if (isRunning.current) return;
    isRunning.current = true;
    setIsLoggingOut(true);
    try {
      await unregisterPushToken();
      // 해제 요청이 액세스 토큰을 갱신하며 리프레시 토큰을 회전시킬 수 있어 그 뒤에 읽는다.
      const refreshToken = await getRefreshToken();
      if (refreshToken) {
        try {
          await mutateAsync(refreshToken); // POST /auth/logout
        } catch {
          // 서버 RTK 삭제 실패는 무시 — 로컬 정리는 계속한다.
        }
      }
      await clearTokens();
      // 다음 로그인이 다른 계정일 수 있다 — 이전 계정의 화면 캐시를 남기지 않는다.
      queryClient.clear();
      router.replace("/(auth)/login");
    } finally {
      isRunning.current = false;
      setIsLoggingOut(false);
    }
  }, [mutateAsync, queryClient, router]);

  return { logout, isPending: isLoggingOut };
}
