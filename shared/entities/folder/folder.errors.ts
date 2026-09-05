// "@shared/api" 배럴 대신 errors 모듈을 직접 참조한다 — 배럴은 client.ts(env 필수)를 함께
// 끌어오는데, 이 파일은 화면에서도 쓰여 env 를 안 채운 테스트에서도 깨지면 안 된다.
import { isApiError } from "@shared/api/errors";

/**
 * 서버 폴더 도메인 errorCode — 서버 `docs/policy/error-code.md` 기준.
 *
 * 상태 코드만으로는 원인을 단정할 수 없어(409·400 이 여러 실패를 함께 쓴다) 이 값으로 구분한다.
 */
export const FOLDER_ERROR_CODE = {
  DUPLICATE_NAME: 920002,
  /** PUT /folders/order 에 넘긴 목록이 현재 폴더 전체와 다를 때(누락·미소유·중복). */
  ORDER_MISMATCH: 920003,
} as const;

/**
 * 폴더 이름 중복 실패인지 판별한다.
 *
 * 409 는 "중복 생성 또는 리소스 상태 충돌" 을 모두 포함하므로 상태 코드로는 단정할 수 없다.
 * 서버 계약(errorCode) 해석은 여기서 하고, 사용자 문구는 화면이 정한다.
 */
export function isDuplicateFolderNameError(error: unknown): boolean {
  return (
    isApiError(error) &&
    error.payload?.error.errorCode === FOLDER_ERROR_CODE.DUPLICATE_NAME
  );
}

/**
 * 폴더 순서 저장 실패가 "목록이 현재 폴더 전체와 다름" 인지 판별한다.
 *
 * 400 은 일반 검증 실패도 포함하므로 상태 코드로는 단정할 수 없다. 이 경우는 화면이 들고
 * 있던 목록이 서버와 어긋난 상태(다른 기기에서 폴더 추가·삭제 등)라 재조회가 필요하다.
 */
export function isFolderOrderMismatchError(error: unknown): boolean {
  return (
    isApiError(error) &&
    error.payload?.error.errorCode === FOLDER_ERROR_CODE.ORDER_MISMATCH
  );
}
