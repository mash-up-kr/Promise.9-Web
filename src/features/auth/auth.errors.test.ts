// client.ts 는 import 시 EXPO_PUBLIC_API_BASE_URL 를 요구하므로 apiClient 만 mock 하고
// 에러 유틸(ApiError·isApiError)은 실제 구현을 쓴다.
jest.mock("@shared/api", () => {
  const errors = jest.requireActual("@shared/api/errors");
  return { apiClient: { get: jest.fn(), post: jest.fn() }, ...errors };
});

import { ApiError } from "@shared/api";
import type { AxiosResponse } from "axios";

import {
  AUTH_ERROR_CODE,
  isEmailAlreadyRegisteredError,
  isUnsupportedProviderError,
} from "./auth.errors";

const apiError = (status: number, errorCode: number) =>
  new ApiError({
    status,
    data: {
      success: false,
      error: {
        code: status,
        errorCode,
        message: "실패",
        timestamp: "2026-08-01T00:00:00.000Z",
      },
    },
  } as unknown as AxiosResponse);

describe("isUnsupportedProviderError", () => {
  it("errorCode 950004 를 판별한다", () => {
    expect(
      isUnsupportedProviderError(
        apiError(400, AUTH_ERROR_CODE.UNSUPPORTED_PROVIDER),
      ),
    ).toBe(true);
  });

  it("다른 errorCode 는 판별하지 않는다", () => {
    expect(isUnsupportedProviderError(apiError(400, 910001))).toBe(false);
  });

  it("API 에러가 아니면 판별하지 않는다", () => {
    expect(isUnsupportedProviderError(new Error("network"))).toBe(false);
  });
});

// 같은 이메일이 다른 provider 로 이미 가입된 경우 — 서버는 계정을 합치지 않고 409 를 돌려준다.
describe("isEmailAlreadyRegisteredError", () => {
  it("errorCode 960002 를 판별한다", () => {
    expect(
      isEmailAlreadyRegisteredError(
        apiError(409, AUTH_ERROR_CODE.EMAIL_ALREADY_REGISTERED),
      ),
    ).toBe(true);
  });

  it("다른 errorCode 는 판별하지 않는다", () => {
    expect(
      isEmailAlreadyRegisteredError(
        apiError(400, AUTH_ERROR_CODE.UNSUPPORTED_PROVIDER),
      ),
    ).toBe(false);
  });

  it("API 에러가 아니면 판별하지 않는다", () => {
    expect(isEmailAlreadyRegisteredError(new Error("network"))).toBe(false);
  });
});
