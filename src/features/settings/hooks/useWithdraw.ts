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
    try {
      // refreshToken 이 없으면 빈 문자열로 요청 → 서버가 거부 → catch 로 수렴.
      await mutateAsync(refreshToken ?? ""); // DELETE /auth/withdraw
      await clearTokens();
      router.replace("/(auth)/login");
    } catch {
      show({ message: "회원 탈퇴에 실패했어요. 다시 시도해주세요." });
    }
  }, [mutateAsync, router, show]);

  return { withdraw, isPending };
}
