/**
 * 사용자가 소셜 로그인 창을 직접 닫았을 때 던진다.
 *
 * 실패가 아니라 "안 하기로 함"이라 화면은 에러 안내 없이 조용히 원복해야 한다.
 * 네이티브(useSocialAuth.ts)·웹(useSocialAuth.web.ts) 양쪽이 같은 클래스를 던져야
 * LoginScreen 의 instanceof 분기가 두 표면에서 동일하게 동작한다.
 */
export class SocialLoginCancelledError extends Error {}
