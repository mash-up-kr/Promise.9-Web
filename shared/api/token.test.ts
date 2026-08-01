import { getAccessToken, setAccessToken } from "./token";

describe("access token store", () => {
  afterEach(() => {
    // 다른 테스트에 토큰 상태가 새지 않도록 초기화한다.
    setAccessToken(null);
  });

  it("setAccessToken 으로 넣은 토큰을 getAccessToken 이 반환한다", async () => {
    setAccessToken("dev-token-123");
    await expect(getAccessToken()).resolves.toBe("dev-token-123");
  });

  it("토큰이 없으면 null 을 반환한다", async () => {
    setAccessToken(null);
    await expect(getAccessToken()).resolves.toBeNull();
  });
});
