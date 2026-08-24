// "@shared/api" 배럴 대신 errors 모듈을 직접 참조한다 — 배럴은 client.ts(env 필수)를 함께
// 끌어오는데, 이 파일은 useSocialAuth(.web).ts 에서 쓰여 env 를 안 채운 테스트에서도 깨진다.
import { isApiError } from "@shared/api/errors";

/**
 * 사용자가 소셜 로그인 창을 직접 닫았을 때 던진다.
 *
 * 실패가 아니라 "안 하기로 함"이라 화면은 에러 안내 없이 조용히 원복해야 한다.
 * 네이티브(useSocialAuth.ts)·웹(useSocialAuth.web.ts) 양쪽이 같은 클래스를 던져야
 * LoginScreen 의 instanceof 분기가 두 표면에서 동일하게 동작한다.
 */
export class SocialLoginCancelledError extends Error {}

// 서버 인증 도메인 errorCode — 서버 docs/policy/error-code.md 기준.
export const AUTH_ERROR_CODE = {
  SOCIAL_TOKEN_VERIFICATION_FAILED: 950003,
  UNSUPPORTED_PROVIDER: 950004,
} as const;

/** 지원하지 않는 provider(errorCode 950004) — 계약 외 provider 방어용(현재 카카오·애플은 서버 지원). */
export function isUnsupportedProviderError(error: unknown): boolean {
  return (
    isApiError(error) &&
    error.payload?.error.errorCode === AUTH_ERROR_CODE.UNSUPPORTED_PROVIDER
  );
}
