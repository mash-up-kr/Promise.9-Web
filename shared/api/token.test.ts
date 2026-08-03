import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setTokenPersistence,
  setTokens,
  type TokenPersistence,
} from "./token";

describe("access token store", () => {
  afterEach(() => {
    // 다른 테스트에 토큰 상태가 새지 않도록 초기화한다.
    setAccessToken(null);
    setTokenPersistence(null);
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

// 실제 저장소(SecureStore/localStorage)는 src/lib/tokenStorage 가 구현해 주입한다 —
// 여기서는 주입 지점(seam)만 검증하고 간단한 메모리 fake 로 대체한다.
function createFakeTokenPersistence(): TokenPersistence {
  let refreshToken: string | null = null;
  return {
    getRefreshToken: jest.fn(async () => refreshToken),
    setRefreshToken: jest.fn(async (token: string | null) => {
      refreshToken = token;
    }),
  };
}

describe("refresh token persistence seam", () => {
  afterEach(() => {
    setAccessToken(null);
    setTokenPersistence(null);
  });

  it("persistence 가 주입되지 않았으면 getRefreshToken 은 null 을 반환한다", async () => {
    await expect(getRefreshToken()).resolves.toBeNull();
  });

  it("setTokens 는 accessToken 을 갱신하고 refreshToken 을 주입된 저장소에 저장한다", async () => {
    const persistence = createFakeTokenPersistence();
    setTokenPersistence(persistence);

    await setTokens("new-access", "new-refresh");

    await expect(getAccessToken()).resolves.toBe("new-access");
    expect(persistence.setRefreshToken).toHaveBeenCalledWith("new-refresh");
    await expect(getRefreshToken()).resolves.toBe("new-refresh");
  });

  it("clearTokens 는 accessToken 과 저장된 refreshToken 을 모두 지운다", async () => {
    const persistence = createFakeTokenPersistence();
    setTokenPersistence(persistence);
    await setTokens("new-access", "new-refresh");

    await clearTokens();

    await expect(getAccessToken()).resolves.toBeNull();
    await expect(getRefreshToken()).resolves.toBeNull();
  });
});
