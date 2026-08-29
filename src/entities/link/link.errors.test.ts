// client.ts(env 필수)를 끌어오지 않도록 errors 모듈만 실제 구현으로 쓴다.
import { ApiError } from "@shared/api/errors";
import type { AxiosResponse } from "axios";

import { isDuplicateLinkError, LINK_ERROR_CODE } from "./link.errors";

const makeApiError = (errorCode: number) =>
  new ApiError({
    status: 409,
    data: {
      success: false,
      error: {
        code: 409,
        errorCode,
        message: "이미 저장한 링크입니다.",
        timestamp: "2026-08-26T00:00:00.000Z",
      },
    },
  } as AxiosResponse);

describe("isDuplicateLinkError", () => {
  it("errorCode 930003 만 중복으로 판별한다", () => {
    expect(
      isDuplicateLinkError(makeApiError(LINK_ERROR_CODE.ALREADY_EXISTS)),
    ).toBe(true);
    expect(isDuplicateLinkError(makeApiError(930002))).toBe(false);
  });

  it("일반 Error 는 false", () => {
    expect(isDuplicateLinkError(new Error("boom"))).toBe(false);
  });
});
