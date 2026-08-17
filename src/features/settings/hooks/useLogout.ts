import { setAccessToken } from "@shared/api";
import { useRouter } from "expo-router";
import { useCallback } from "react";

/**
 * 로그아웃 액션 seam.
 *
 * 로그인(#56)·auth 후속 이슈가 머지되기 전까지는 최소 동작만 한다.
 * #56 이 제공하는 토큰 seam(getRefreshToken·clearTokens)과 서버 연동은
 * 후속 브랜치에서 아래 TODO 지점을 채운다 — plan/settings-auth-actions-followup.md.
 */
export function useLogout() {
  const router = useRouter();

  return useCallback(async () => {
    // TODO(#auth): #56 머지 후 연결
    //   const refreshToken = await getRefreshToken();
    //   if (refreshToken) await logout({ refreshToken });  // POST /auth/logout
    //   await clearTokens();
    setAccessToken(null);
    router.replace("/(auth)/login");
  }, [router]);
}
