import type { SocialProvider } from "@shared/api";

// 서버 계약(POST /auth/social)의 provider 타입을 그대로 쓴다 — 여기서 다시 정의하지 않는다.
export type { SocialProvider } from "@shared/api";

export const AUTH_ERROR_CODE = {
  SOCIAL_TOKEN_VERIFICATION_FAILED: 950003,
  UNSUPPORTED_PROVIDER: 950004,
} as const;

export interface SocialProviderConfig {
  provider: SocialProvider;
  label: string;
  // 카카오는 서버가 아직 미구현(POST /auth/social 이 provider=kakao 에 950004 를 반환) — 연결되면 true 로.
  enabled: boolean;
}

export const SOCIAL_PROVIDERS: readonly SocialProviderConfig[] = [
  { provider: "google", label: "구글로 로그인", enabled: true },
  { provider: "kakao", label: "카카오로 로그인", enabled: false },
];
