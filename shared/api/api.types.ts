/** 성공 응답 envelope — 서버 공통 래퍼(success + data). */
export interface SuccessResponse<T> {
  success: true;
  data: T;
}

/** 에러 본문 — 서버 ErrorDataDto. */
export interface ErrorData {
  code: number;
  errorCode: number;
  message: string;
  timestamp: string;
}

/** 에러 응답 envelope — 서버 ErrorResponseDto(success:false + error). */
export interface ErrorResponse {
  success: false;
  error: ErrorData;
}

/** 커서 페이지네이션 메타 — 서버 CursorPaginationResponseDto. 목록 DTO 가 items 와 함께 임베드한다. */
export interface CursorPagination {
  nextCursor: string | null;
  hasNext: boolean;
  limit: number;
}
