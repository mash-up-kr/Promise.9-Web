import {
  socialLoginRequestSchema,
  socialLoginResponseSchema,
} from "./auth.contracts";

describe("socialLoginRequestSchema", () => {
  it("provider·idToken 이 유효하면 통과한다", () => {
    expect(() =>
      socialLoginRequestSchema.parse({
        provider: "google",
        idToken: "mock-id-token",
      }),
    ).not.toThrow();
  });

  it("계약에 없는 provider 는 실패한다", () => {
    expect(() =>
      socialLoginRequestSchema.parse({
        provider: "naver",
        idToken: "mock-id-token",
      }),
    ).toThrow();
  });

  it("apple 도 계약상 유효하다(UI 는 비활성이나 스키마는 허용)", () => {
    expect(() =>
      socialLoginRequestSchema.parse({
        provider: "apple",
        idToken: "mock-id-token",
      }),
    ).not.toThrow();
  });
});

describe("socialLoginResponseSchema", () => {
  it("accessToken·refreshToken·isNewUser 가 모두 있으면 통과한다", () => {
    expect(() =>
      socialLoginResponseSchema.parse({
        accessToken: "at",
        refreshToken: "rt",
        isNewUser: true,
      }),
    ).not.toThrow();
  });

  it("필드가 누락되면 실패한다", () => {
    expect(() =>
      socialLoginResponseSchema.parse({ accessToken: "at" }),
    ).toThrow();
  });
});
