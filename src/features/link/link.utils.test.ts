import { getDomain, shouldShowAiSummary } from "./link.utils";

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
