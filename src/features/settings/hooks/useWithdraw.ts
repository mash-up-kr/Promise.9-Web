import { clearTokens, getRefreshToken } from "@shared/api";
import { useWithdrawMutation } from "@shared/entities/auth/auth.queries";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { useSnackbar } from "@/components/ui/snackbar/SnackbarProvider";

/**
 * 회원 탈퇴 — 파괴적이라 서버 성공을 신뢰 기준으로 삼는다.
 * 서버 실패 시 로컬 정리 없이 세션을 유지하고 스낵바로 안내한다(로그아웃과 다름 —
 * soft delete 가 안 됐는데 로컬만 지우면 "탈퇴됨"으로 오해할 수 있다).
 * plan/settings-auth-actions-followup.md 2.1
 */
export function useWithdraw() {
  const router = useRouter();
  const { show } = useSnackbar();
  const { mutateAsync, isPending } = useWithdrawMutation();

  const withdraw = useCallback(async () => {
    const refreshToken = await getRefreshToken();
    // 세션이 없으면(비정상 진입) 서버 탈퇴는 성공할 수 없다 — 재시도가 아니라
    // 재로그인이 답이라, 로컬 세션을 정리하고 로그인으로 보낸다(issue #74).
    if (!refreshToken) {
      await clearTokens();
      show({ message: "세션이 만료됐어요. 다시 로그인해주세요." });
      router.replace("/(auth)/login");
      return;
    }
    try {
      await mutateAsync(refreshToken); // DELETE /auth/withdraw
      await clearTokens();
      router.replace("/(auth)/login");
    } catch {
      show({ message: "회원 탈퇴에 실패했어요. 다시 시도해주세요." });
    }
  }, [mutateAsync, router, show]);

  return { withdraw, isPending };
}
