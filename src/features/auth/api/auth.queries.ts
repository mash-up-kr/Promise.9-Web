import {
  apiClient,
  isApiError,
  type SocialLoginRequest,
  type SuccessResponse,
  setTokens,
  socialLoginResponseSchema,
} from "@shared/api";
import { useMutation } from "@tanstack/react-query";

import { AUTH_ERROR_CODE } from "../auth.constants";

/** 소셜 ID 토큰 검증 실패(errorCode 950003) — 소셜 SDK 가 만료·위조된 idToken 을 넘긴 경우. */
export function isSocialTokenVerificationError(error: unknown): boolean {
  return (
    isApiError(error) &&
    error.payload?.error.errorCode ===
      AUTH_ERROR_CODE.SOCIAL_TOKEN_VERIFICATION_FAILED
  );
}

/** 지원하지 않는 provider(errorCode 950004) — 현재는 카카오가 여기 해당(서버 미구현). */
export function isUnsupportedProviderError(error: unknown): boolean {
  return (
    isApiError(error) &&
    error.payload?.error.errorCode === AUTH_ERROR_CODE.UNSUPPORTED_PROVIDER
  );
}

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
