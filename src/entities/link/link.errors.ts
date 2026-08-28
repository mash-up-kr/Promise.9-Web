// client.ts(env 필수)를 끌어오지 않도록 errors 모듈만 실제 구현으로 쓴다.
import { isApiError } from "@shared/api/errors";

/** 서버 링크 도메인 errorCode — link-error.constant.ts 기준. */
export const LINK_ERROR_CODE = {
  /** 같은 사용자가 이미 저장한(삭제되지 않은) 정규화 동일 URL. */
  ALREADY_EXISTS: 930003,
} as const;

// 409 는 여러 충돌을 함께 쓰므로 상태 코드가 아니라 errorCode 로 판별한다.
export function isDuplicateLinkError(error: unknown): boolean {
  return (
    isApiError(error) &&
    error.payload?.error.errorCode === LINK_ERROR_CODE.ALREADY_EXISTS
  );
}
