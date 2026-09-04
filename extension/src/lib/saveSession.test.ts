import { ApiError } from "@shared/api/errors";
import { LINK_ERROR_CODE } from "@shared/entities/link/link.errors";
import type { AxiosResponse } from "axios";
import { describe, expect, it } from "vitest";

import {
  MAX_SAVE_ATTEMPTS,
  resolveFailure,
  resolveSuccess,
  type SaveSession,
  startSaving,
} from "./saveSession";

const URL_A = "https://toss.tech/article/1";
const URL_B = "https://toss.tech/article/2";

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

const duplicateError = apiError(409, LINK_ERROR_CODE.ALREADY_SAVED);
const serverError = apiError(500, 910002);

/** 같은 URL 을 n 번 연속 실패시킨 세션. */
const failedTimes = (times: number): SaveSession => {
  let session = startSaving(URL_A, null);
  for (let i = 0; i < times; i += 1) {
    session = resolveFailure(startSaving(URL_A, session), serverError);
  }
  return session;
};

describe("startSaving", () => {
  it("저장을 시작하면 saving 상태가 된다", () => {
    expect(startSaving(URL_A, null)).toEqual({
      url: URL_A,
      phase: "saving",
      linkId: null,
      failureCount: 0,
    });
  });

  it("같은 URL 을 다시 시도하면 실패 횟수를 이어간다", () => {
    const previous = failedTimes(1);

    expect(startSaving(URL_A, previous).failureCount).toBe(1);
  });

  it("다른 URL 이면 실패 횟수를 초기화한다", () => {
    // 재시도 한도는 "이 링크를 반복해서 못 저장했다" 는 뜻이라 링크가 바뀌면 리셋한다.
    const previous = failedTimes(2);

    expect(startSaving(URL_B, previous).failureCount).toBe(0);
  });
});

describe("resolveSuccess", () => {
  it("성공하면 linkId 를 싣고 실패 횟수를 초기화한다", () => {
    const session = startSaving(URL_A, failedTimes(2));

    expect(resolveSuccess(session, 42)).toEqual({
      url: URL_A,
      phase: "success",
      linkId: 42,
      failureCount: 0,
    });
  });
});

describe("resolveFailure", () => {
  it("이미 저장된 링크면 duplicate 이고 실패로 세지 않는다", () => {
    // 중복은 재시도해도 결과가 같다 — 재시도 한도의 대상이 아니다.
    const session = resolveFailure(startSaving(URL_A, null), duplicateError);

    expect(session.phase).toBe("duplicate");
    expect(session.failureCount).toBe(0);
  });

  it("한도 미만이면 failed 이고 실패 횟수가 늘어난다", () => {
    const session = resolveFailure(startSaving(URL_A, null), serverError);

    expect(session.phase).toBe("failed");
    expect(session.failureCount).toBe(1);
  });

  it(`${MAX_SAVE_ATTEMPTS}회째 실패부터는 retry-limit 이다`, () => {
    const session = failedTimes(MAX_SAVE_ATTEMPTS);

    expect(session.phase).toBe("retry-limit");
    expect(session.failureCount).toBe(MAX_SAVE_ATTEMPTS);
  });

  it("한도를 넘겨도 retry-limit 을 유지한다", () => {
    const session = failedTimes(MAX_SAVE_ATTEMPTS + 1);

    expect(session.phase).toBe("retry-limit");
  });
});
