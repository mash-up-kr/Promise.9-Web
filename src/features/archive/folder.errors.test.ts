// client.ts(env 필수)를 끌어오지 않도록 errors 모듈만 실제 구현으로 쓴다.
import { ApiError } from "@shared/api/errors";
import type { AxiosResponse } from "axios";

import {
  FOLDER_ERROR_CODE,
  isDuplicateFolderNameError,
  isFolderOrderMismatchError,
} from "./folder.errors";

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

describe("isDuplicateFolderNameError", () => {
  it("폴더 이름 중복 errorCode 를 판별한다", () => {
    expect(
      isDuplicateFolderNameError(
        apiError(409, FOLDER_ERROR_CODE.DUPLICATE_NAME),
      ),
    ).toBe(true);
  });

  // 409 는 "중복 생성 또는 리소스 상태 충돌" 이라 상태 코드만으로는 단정할 수 없다.
  it("중복 이름이 아닌 409 는 판별하지 않는다", () => {
    expect(isDuplicateFolderNameError(apiError(409, 910002))).toBe(false);
  });

  it("API 에러가 아니면 판별하지 않는다", () => {
    expect(isDuplicateFolderNameError(new Error("network"))).toBe(false);
  });
});

describe("isFolderOrderMismatchError", () => {
  it("폴더 순서 불일치 errorCode 를 판별한다", () => {
    expect(
      isFolderOrderMismatchError(
        apiError(400, FOLDER_ERROR_CODE.ORDER_MISMATCH),
      ),
    ).toBe(true);
  });

  it("순서 불일치가 아닌 400 은 판별하지 않는다", () => {
    expect(isFolderOrderMismatchError(apiError(400, 910001))).toBe(false);
  });

  it("API 에러가 아니면 판별하지 않는다", () => {
    expect(isFolderOrderMismatchError(new Error("network"))).toBe(false);
  });
});
