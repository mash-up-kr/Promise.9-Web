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

/**
 * 중복 저장 409 가 담아주는 기존 링크 ID (서버 PR #109). '보러가기' 딥링크용.
 * linkId 는 링크 도메인 전용 확장 필드라 공용 ErrorData 타입에는 넣지 않는다.
 */
export function getDuplicateLinkId(error: unknown): number | null {
  if (!isDuplicateLinkError(error) || !isApiError(error)) {
    return null;
  }
  const { linkId } = error.payload?.error as { linkId?: unknown };
  return typeof linkId === "number" ? linkId : null;
}
