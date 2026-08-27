// client.ts(env 필수)를 끌어오지 않도록 errors 모듈만 실제 구현으로 쓴다.
import { ApiError } from "@shared/api/errors";
import type { AxiosResponse } from "axios";

import { isAlreadySavedLinkError, LINK_ERROR_CODE } from "./link.errors";

const apiError = (status: number, errorCode: number) =>
  new ApiError({
    status,
    data: {
      success: false,
      error: {
        code: status,
        errorCode,
        message: "요청을 처리하지 못했습니다.",
        timestamp: "2026-07-26T00:00:00.000Z",
      },
    },
  } as unknown as AxiosResponse);

describe("isAlreadySavedLinkError", () => {
  it("이미 저장한 링크 errorCode 를 판별한다", () => {
    expect(
      isAlreadySavedLinkError(apiError(409, LINK_ERROR_CODE.ALREADY_SAVED)),
    ).toBe(true);
  });

  // 409 는 "중복 생성 또는 리소스 상태 충돌" 이라 상태 코드만으로는 단정할 수 없다.
  it("이미 저장한 링크가 아닌 409 는 판별하지 않는다", () => {
    expect(isAlreadySavedLinkError(apiError(409, 910002))).toBe(false);
  });

  it("API 에러가 아니면 판별하지 않는다", () => {
    expect(isAlreadySavedLinkError(new Error("network"))).toBe(false);
  });
});
