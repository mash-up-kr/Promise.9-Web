// "@shared/api" 배럴 대신 errors 모듈을 직접 참조한다 — 배럴은 client.ts(env 필수)를 함께
// 끌어오는데, 이 파일은 화면에서도 쓰여 env 를 안 채운 테스트에서도 깨지면 안 된다.
import { isApiError } from "@shared/api/errors";

/**
 * 서버 링크 도메인 errorCode — 서버 `docs/policy/error-code.md` · `link-error.constant.ts` 기준.
 */
export const LINK_ERROR_CODE = {
  NOT_FOUND: 930001,
  /** POST /links 에 이미 저장한 URL 을 다시 보냈을 때(409). */
  ALREADY_SAVED: 930003,
} as const;

/**
 * 링크 저장 실패가 "이미 저장한 링크" 인지 판별한다.
 *
 * 409 는 "중복 생성 또는 리소스 상태 충돌" 을 모두 포함하므로 상태 코드로는 단정할 수 없다.
 * 서버 계약(errorCode) 해석은 여기서 하고, 사용자 문구는 화면이 정한다.
 *
 * 서버는 이 응답에 기존 링크의 `linkId` 를 담지 않는다 — 중복 화면에서 그 링크로 바로
 * 이동시킬 수 없는 이유다.
 */
export function isAlreadySavedLinkError(error: unknown): boolean {
  return (
    isApiError(error) &&
    error.payload?.error.errorCode === LINK_ERROR_CODE.ALREADY_SAVED
  );
}
