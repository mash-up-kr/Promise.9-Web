import { describe, expect, it } from "vitest";

import { buildGoogleAuthUrl, extractIdToken } from "./googleAuth";

const PARAMS = {
  clientId: "client-123.apps.googleusercontent.com",
  redirectUri: "https://abcdef.chromiumapp.org/",
  nonce: "nonce-1",
  state: "state-1",
};

describe("buildGoogleAuthUrl", () => {
  it("액세스 토큰이 아니라 idToken 만 요청한다", () => {
    // client_secret 없이 끝내려면 implicit id_token 흐름이어야 한다.
    const url = new URL(buildGoogleAuthUrl(PARAMS));

    expect(url.origin + url.pathname).toBe(
      "https://accounts.google.com/o/oauth2/v2/auth",
    );
    expect(url.searchParams.get("response_type")).toBe("id_token");
    expect(url.searchParams.get("scope")).toBe("openid email profile");
    expect(url.searchParams.get("client_id")).toBe(PARAMS.clientId);
    expect(url.searchParams.get("redirect_uri")).toBe(PARAMS.redirectUri);
    expect(url.searchParams.get("nonce")).toBe(PARAMS.nonce);
    expect(url.searchParams.get("state")).toBe(PARAMS.state);
    // 계정이 하나뿐이어도 선택 화면을 띄운다.
    expect(url.searchParams.get("prompt")).toBe("select_account");
  });
});

describe("extractIdToken", () => {
  const redirect = (fragment: string) =>
    `https://abcdef.chromiumapp.org/#${fragment}`;

  it("fragment 에서 idToken 을 꺼낸다", () => {
    // implicit 결과는 쿼리가 아니라 fragment 로 온다.
    expect(
      extractIdToken(redirect("id_token=abc&state=state-1"), "state-1"),
    ).toBe("abc");
  });

  it("state 가 다르면 토큰을 쓰지 않는다", () => {
    expect(() =>
      extractIdToken(redirect("id_token=abc&state=다른값"), "state-1"),
    ).toThrow(/state/);
  });

  it("구글이 에러를 돌려주면 그대로 알린다", () => {
    expect(() =>
      extractIdToken(redirect("error=access_denied"), "state-1"),
    ).toThrow(/access_denied/);
  });

  it("idToken 이 없으면 실패로 다룬다", () => {
    expect(() => extractIdToken(redirect("state=state-1"), "state-1")).toThrow(
      /idToken/,
    );
  });
});
