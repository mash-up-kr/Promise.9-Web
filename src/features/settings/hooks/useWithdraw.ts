import { setAccessToken } from "@shared/api";
import { useRouter } from "expo-router";
import { useCallback } from "react";

/**
 * 회원 탈퇴 액션 seam.
 *
 * 로그인(#56)·auth 후속 이슈 머지 전까지 최소 동작만 한다. 후속 브랜치에서 아래 TODO 를
 * 채운다 — plan/settings-auth-actions-followup.md.
 *
 * 주의(후속): 탈퇴는 로그아웃과 달리 **서버 실패 시 세션을 유지**하고 스낵바로 안내한다
 * (soft delete 가 안 됐는데 로컬만 지우면 "탈퇴됨"으로 오해). 실연동 시 반영.
 */
export function useWithdraw() {
  const router = useRouter();

  return useCallback(async () => {
    // TODO(#auth): #56 머지 후 연결
    //   const refreshToken = await getRefreshToken();
    //   await withdraw({ refreshToken });   // DELETE /auth/withdraw
    //   await clearTokens();
    setAccessToken(null);
    router.replace("/(auth)/login");
  }, [router]);
}
