/** NestJS HttpException 의 기본 에러 응답 envelope */
export interface ErrorResponse {
  statusCode: number;
  message: string;
  error?: string;
}

/**
 * 페이지네이션 응답 (초안 · 백엔드 spec 미정 → flat 컨벤션, 확정 시 조정)
 *
 * @example
 * apiClient.get<PaginatedResponse<Link>>('/links?page=1')
 * // → AxiosResponse<PaginatedResponse<Link>>
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
