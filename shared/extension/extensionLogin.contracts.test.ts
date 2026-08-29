import {
  EXTENSION_LOGIN_MESSAGE_SOURCE,
  extensionLoginMessageSchema,
} from "./extensionLogin.contracts";

describe("extensionLoginMessageSchema", () => {
  const valid = {
    source: EXTENSION_LOGIN_MESSAGE_SOURCE,
    provider: "google",
    idToken: "id-token",
  };

  test("웹앱이 보내는 로그인 인계 메시지를 받아들인다", () => {
    expect(extensionLoginMessageSchema.safeParse(valid).success).toBe(true);
  });

  // 확장은 onMessageExternal 로 아무 페이지의 메시지든 받을 수 있어, 우리 것만 골라내야 한다.
  test("source 가 다르면 거부한다", () => {
    expect(
      extensionLoginMessageSchema.safeParse({ ...valid, source: "other" })
        .success,
    ).toBe(false);
  });

  test("idToken 이 비어 있으면 거부한다", () => {
    expect(
      extensionLoginMessageSchema.safeParse({ ...valid, idToken: "" }).success,
    ).toBe(false);
  });

  test("서버가 모르는 provider 는 거부한다", () => {
    expect(
      extensionLoginMessageSchema.safeParse({ ...valid, provider: "naver" })
        .success,
    ).toBe(false);
  });
});
