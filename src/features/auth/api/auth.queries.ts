import {
  apiClient,
  type SocialLoginRequest,
  type SuccessResponse,
  setTokens,
  socialLoginResponseSchema,
} from "@shared/api";
import { useMutation } from "@tanstack/react-query";

// POST /auth/social — 소셜 idToken 으로 로그인하고, 발급된 토큰을 저장한다.
export function useSocialLoginMutation() {
  return useMutation({
    mutationFn: async (payload: SocialLoginRequest) => {
      const { data } = await apiClient.post<SuccessResponse<unknown>>(
        "/auth/social",
        payload,
      );
      const parsed = socialLoginResponseSchema.parse(data.data);

      await setTokens(parsed.accessToken, parsed.refreshToken);

      return parsed;
    },
  });
}
