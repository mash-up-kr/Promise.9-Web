import { LINK_PROCESSING } from "./link.constants";
import {
  getDetailRefetchInterval,
  getDomain,
  isWithinProcessingWindow,
  shouldShowAiSummary,
} from "./link.utils";

const SUMMARY =
  "토스뱅크 인턴이 비회원 가입 전환율을 개선하는 과정에서 실험 설계와 가설 검증의 중요성을 배운 경험을 소개하는 글이에요.";

describe("shouldShowAiSummary", () => {
  test("PENDING 은 요약이 없어도 노출한다", () => {
    expect(shouldShowAiSummary("PENDING", null)).toBe(true);
  });

  test("요약 텍스트가 있으면 노출한다", () => {
    expect(shouldShowAiSummary("SUCCESS", SUMMARY)).toBe(true);
  });

  test("FAILED·빈 요약은 숨긴다", () => {
    expect(shouldShowAiSummary("FAILED", null)).toBe(false);
    expect(shouldShowAiSummary("SUCCESS", "")).toBe(false);
    expect(shouldShowAiSummary("SUCCESS", "   ")).toBe(false);
  });
});

it("도메인 추출 — www 제거, 비 http(s) 는 null", () => {
  expect(getDomain("https://www.bucketplace.com/post/1")).toBe(
    "bucketplace.com",
  );
  expect(getDomain("http://toss.tech")).toBe("toss.tech");
  expect(getDomain("HTTPS://Example.COM/a?b=c")).toBe("example.com");
  expect(getDomain("ftp://x.com")).toBeNull();
  expect(getDomain("not-a-url")).toBeNull();
});

// 상세 응답은 processingStatus 를 직접 주므로 PENDING 인 동안만 다시 조회한다. 다만 서버가
// 상태를 확정하지 못하는 경우를 대비해 저장 시각 상한을 함께 본다.
describe("getDetailRefetchInterval", () => {
  const now = Date.parse("2026-09-08T00:00:00.000Z");
  const justSaved = new Date(now - 30_000).toISOString();
  const longAgo = new Date(now - LINK_PROCESSING.maxWaitMs - 1).toISOString();

  test("방금 저장된 PENDING 이면 폴링 간격을 돌려준다", () => {
    expect(
      getDetailRefetchInterval(
        { processingStatus: "PENDING", savedAt: justSaved },
        now,
      ),
    ).toBe(LINK_PROCESSING.pollIntervalMs);
  });

  test.each([
    "SUCCESS",
    "FAILED",
    "NEEDS_REVIEW",
  ] as const)("%s 면 폴링하지 않는다", (status) => {
    expect(
      getDetailRefetchInterval(
        { processingStatus: status, savedAt: justSaved },
        now,
      ),
    ).toBe(false);
  });

  test("PENDING 이어도 저장한 지 오래됐으면 폴링하지 않는다", () => {
    expect(
      getDetailRefetchInterval(
        { processingStatus: "PENDING", savedAt: longAgo },
        now,
      ),
    ).toBe(false);
  });

  test("데이터가 아직 없으면 폴링하지 않는다", () => {
    expect(getDetailRefetchInterval(undefined, now)).toBe(false);
  });
});

describe("isWithinProcessingWindow", () => {
  const now = Date.parse("2026-09-08T00:00:00.000Z");

  test("해석할 수 없는 시각은 기다리지 않는다", () => {
    expect(isWithinProcessingWindow("언제인지 모름", now)).toBe(false);
  });
});
