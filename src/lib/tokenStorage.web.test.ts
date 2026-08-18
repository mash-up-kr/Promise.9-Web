import { tokenPersistence } from "./tokenStorage.web";

// 이 jest 환경의 전역 localStorage 는 실험적 Node 구현이라 clear() 등 일부 메서드가 없고
// 동작이 불안정하다 — 실제 브라우저 localStorage 와 동일한 Map 기반 stub 으로 교체해 검증한다.
function installFakeLocalStorage() {
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
    },
  });
}

describe("tokenStorage (웹 — localStorage)", () => {
  beforeEach(() => {
    installFakeLocalStorage();
  });

  it("저장한 refreshToken 을 getRefreshToken 이 반환한다", async () => {
    await tokenPersistence.setRefreshToken("new-refresh");

    await expect(tokenPersistence.getRefreshToken()).resolves.toBe(
      "new-refresh",
    );
  });

  it("저장된 값이 없으면 null 을 반환한다", async () => {
    await expect(tokenPersistence.getRefreshToken()).resolves.toBeNull();
  });

  it("setRefreshToken(null) 은 저장된 값을 지운다", async () => {
    await tokenPersistence.setRefreshToken("new-refresh");
    await tokenPersistence.setRefreshToken(null);

    await expect(tokenPersistence.getRefreshToken()).resolves.toBeNull();
  });
});
