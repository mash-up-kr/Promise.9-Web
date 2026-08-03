import { z } from "zod";

// provider 계약 — Swagger POST /auth/social 기준. 서버는 현재 google 만 지원하고
// kakao 는 요청 계약만 열어 둔 상태(TODO, errorCode 950004). 애플 추가 시 여기에 항목만 늘린다.
export const socialProviderSchema = z.enum(["google", "kakao"]);
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
