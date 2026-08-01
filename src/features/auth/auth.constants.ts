export type SocialProvider = "google" | "kakao";

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
