import type { SocialProvider } from "@shared/api";

// 서버 계약(POST /auth/social)의 provider 타입을 그대로 쓴다 — 여기서 다시 정의하지 않는다.
export type { SocialProvider } from "@shared/api";

export interface SocialProviderConfig {
  label: string;
  // 서버·SDK 연동이 끝난 provider 만 true. 애플은 iOS 네이티브만 지원(아래 isIOS 로).
  enabled: boolean;
}

// Record<SocialProvider, ...> + satisfies — provider 가 늘어나도 여기 추가를 깜빡하면
// 컴파일 에러로 잡힌다. 배열이었다면 빠뜨려도 타입 통과라 화면에서만 조용히 샌다.
// 키 순서 = 화면 노출 순서(시안: 카카오 → 구글 → 애플). enabled=false 는 노출하되 비활성(disabled).
export const SOCIAL_PROVIDERS = {
  kakao: { label: "카카오로 계속하기", enabled: true },
  google: { label: "Google로 계속하기", enabled: true },
  apple: { label: "Apple로 계속하기", enabled: false },
} satisfies Record<SocialProvider, SocialProviderConfig>;
