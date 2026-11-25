import { ANALYTICS_EVENTS } from "@shared/analytics/analytics.events";
import {
  apiClient,
  type SocialLoginRequest,
  type SuccessResponse,
  setTokens,
  socialLoginResponseSchema,
} from "@shared/api";
import { useMutation } from "@tanstack/react-query";
import { useAnalytics } from "@/components/analytics/AnalyticsContext";

// POST /auth/social — 소셜 idToken 으로 로그인하고, 발급된 토큰을 저장한다.
export function useSocialLoginMutation() {
  const analytics = useAnalytics();
  return useMutation({
    mutationFn: async (payload: SocialLoginRequest) => {
      const { data } = await apiClient.post<SuccessResponse<unknown>>(
        "/auth/social",
        payload,
      );
      const parsed = socialLoginResponseSchema.parse(data.data);

      await setTokens(parsed.accessToken, parsed.refreshToken);
      analytics.trackEvent(
        {
          event_name: ANALYTICS_EVENTS.LOGIN_COMPLETED,
          custom_data: { provider: payload.provider },
        },
        { flushSoon: true },
      );

      if (parsed.isNewUser)
        analytics.trackEvent(
          {
            event_name: ANALYTICS_EVENTS.SIGNUP_COMPLETED,
            custom_data: { provider: payload.provider },
          },
          { flushSoon: true },
        );

      return parsed;
    },
  });
}
