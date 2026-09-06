import { z } from "zod";

// provider 계약 — Swagger POST /auth/social 기준. google·kakao·apple 모두 서버 지원.
// 플랫폼별 활성화(웹/네이티브·iOS 한정)는 SOCIAL_PROVIDERS 에서 관리한다.
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

// 웹 전용 — 카카오 authorization code 를 서버가 idToken 으로 교환한다(POST /auth/kakao/exchange).
// 웹은 client_secret 을 다룰 수 없어 이 프록시가 필수다(카카오 로그인 idToken 발급 방식 공유 문서 참고).
export const kakaoExchangeRequestSchema = z.object({
  code: z.string(),
  redirectUri: z.string(),
});
export type KakaoExchangeRequest = z.infer<typeof kakaoExchangeRequestSchema>;

export const kakaoExchangeResponseSchema = z.object({
  idToken: z.string(),
});
export type KakaoExchangeResponse = z.infer<typeof kakaoExchangeResponseSchema>;

// POST /auth/refresh 응답 — RTR(재발급 시 기존 refreshToken 폐기, 신규 발급).
export const refreshResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});
export type RefreshResponse = z.infer<typeof refreshResponseSchema>;

// POST /auth/extension-token 응답 — 서버가 /auth/refresh 와 같은 TokenPairResponseDto 를 쓴다.
// 웹 로그인 세션의 액세스 토큰으로 호출하면, 익스텐션에 인계할 **별개 tokenFamily** 의 토큰쌍을 발급한다.
export const extensionTokenResponseSchema = refreshResponseSchema;
export type ExtensionTokenResponse = z.infer<
  typeof extensionTokenResponseSchema
>;
