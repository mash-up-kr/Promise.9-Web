import type { SocialProvider } from "@shared/api";

// 서버 계약(POST /auth/social)의 provider 타입을 그대로 쓴다 — 여기서 다시 정의하지 않는다.
export type { SocialProvider } from "@shared/api";

export interface SocialProviderConfig {
  label: string;
  // 카카오는 서버가 아직 미구현(POST /auth/social 이 provider=kakao 에 950004 를 반환) — 연결되면 true 로.
  enabled: boolean;
}

// Record<SocialProvider, ...> + satisfies — provider 가 늘어나도(예: 애플) 여기 추가를
// 깜빡하면 컴파일 에러로 잡힌다. 배열이었다면 빠뜨려도 타입 통과라 화면에서만 조용히 샌다.
export const SOCIAL_PROVIDERS = {
  google: { label: "구글로 로그인", enabled: true },
  kakao: { label: "카카오로 로그인", enabled: false },
} satisfies Record<SocialProvider, SocialProviderConfig>;
