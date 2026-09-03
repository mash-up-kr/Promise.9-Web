import { clearTokens, getRefreshToken } from "@shared/api";
import { useLogoutMutation } from "@shared/entities/auth/auth.queries";
import { useRouter } from "expo-router";
import { useCallback } from "react";

/**
 * 로그아웃 — "빠져나가기"가 목적이라 서버 실패해도 로컬 세션은 정리하고 로그인으로 보낸다.
 * (서버 RTK 삭제 실패로 사용자를 붙잡지 않는다 — plan/settings-auth-actions-followup.md 2.1)
 */
export function useLogout() {
  const router = useRouter();
  const { mutateAsync, isPending } = useLogoutMutation();

  const logout = useCallback(async () => {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      try {
        await mutateAsync(refreshToken); // POST /auth/logout
      } catch {
        // 서버 RTK 삭제 실패는 무시 — 로컬 정리는 계속한다.
      }
    }
    await clearTokens();
    router.replace("/(auth)/login");
  }, [mutateAsync, router]);

  return { logout, isPending };
}
