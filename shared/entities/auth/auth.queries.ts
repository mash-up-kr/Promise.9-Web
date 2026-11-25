import { apiClient } from "@shared/api";
import { useMutation } from "@tanstack/react-query";

// 세 표면이 함께 쓴다 — 설정의 로그아웃·탈퇴, 그리고 익스텐션 연결에 실패해 발급만 되고
// 쓰이지 않은 토큰쌍을 폐기할 때(src/features/auth/extensionHandoff).
// POST /auth/logout · DELETE /auth/withdraw — 서버는 body 의 refreshToken 으로 세션을 식별한다(→204).
// 로그아웃은 만료된 refreshToken 도 받고, pushToken 이 오면 그 회원의 이 기기 토큰도 함께 지운다(서버 #158).
// 요청은 검증할 필요가 없고 응답 바디도 없어 zod 계약을 두지 않는다.
export async function logoutRequest(
  refreshToken: string,
  pushToken?: string,
): Promise<void> {
  await apiClient.post("/auth/logout", {
    refreshToken,
    ...(pushToken && { pushToken }),
  });
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
