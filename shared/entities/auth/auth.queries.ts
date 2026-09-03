import { apiClient } from "@shared/api";
import { useMutation } from "@tanstack/react-query";

// POST /auth/logout · DELETE /auth/withdraw — 서버는 body 의 refreshToken 으로 세션을 식별한다(→204).
// 요청은 검증할 필요가 없고 응답 바디도 없어 zod 계약을 두지 않는다.
export async function logoutRequest(refreshToken: string): Promise<void> {
  await apiClient.post("/auth/logout", { refreshToken });
}

// axios delete 는 body 를 config.data 로 보낸다.
export async function withdrawRequest(refreshToken: string): Promise<void> {
  await apiClient.delete("/auth/withdraw", { data: { refreshToken } });
}

export function useLogoutMutation() {
  return useMutation({ mutationFn: logoutRequest });
}

export function useWithdrawMutation() {
  return useMutation({ mutationFn: withdrawRequest });
}
