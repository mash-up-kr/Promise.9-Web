import { z } from "zod";

// provider 계약 — Swagger POST /auth/social 기준. 서버는 현재 google 만 지원한다.
// kakao·apple 은 요청 계약만 열어 둔 상태(서버 미구현 → errorCode 950004). UI 버튼은 비활성(SOCIAL_PROVIDERS).
export const socialProviderSchema = z.enum(["google", "kakao", "apple"]);
export type SocialProvider = z.infer<typeof socialProviderSchema>;

export const socialLoginRequestSchema = z.object({
  provider: socialProviderSchema,
  idToken: z.string(),
});
export type SocialLoginRequest = z.infer<typeof socialLoginRequestSchema>;

export const socialLoginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  isNewUser: z.boolean(),
});
export type SocialLoginResponse = z.infer<typeof socialLoginResponseSchema>;

// POST /auth/refresh 응답 — RTR(재발급 시 기존 refreshToken 폐기, 신규 발급).
export const refreshResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});
export type RefreshResponse = z.infer<typeof refreshResponseSchema>;
