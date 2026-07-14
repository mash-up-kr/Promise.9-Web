import type { AxiosResponse } from "axios";

import type { ErrorResponse } from "./api.types";

export abstract class HttpError extends Error {}

export class NetworkError extends HttpError {}
export class TimeoutError extends HttpError {}

export class ApiError extends HttpError {
  readonly statusCode: number;
  readonly serverMessage: string;
  readonly payload: ErrorResponse | undefined;

  constructor(
    response: AxiosResponse<ErrorResponse>,
    options?: { cause?: unknown },
  ) {
    const message = response.data?.message ?? `HTTP ${response.status}`;
    super(message, options);
    this.statusCode = response.status;
    this.serverMessage = message;
    this.payload = response.data;
  }
}

export class UnauthorizedError extends ApiError {}

export const isHttpError = (e: unknown): e is HttpError =>
  e instanceof HttpError;
export const isApiError = (e: unknown): e is ApiError => e instanceof ApiError;
export const isUnauthorizedError = (e: unknown): e is UnauthorizedError =>
  e instanceof UnauthorizedError;
export const isServerError = (e: unknown): e is ApiError =>
  isApiError(e) && e.statusCode >= 500;
export const isClientError = (e: unknown): e is ApiError =>
  isApiError(e) && e.statusCode >= 400 && e.statusCode < 500;
