import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { installChromeMock } from "@/test/chromeMock";

import { chromeTokenPersistence } from "./tokenStorage";

const request = vi.fn(
  async (_name: string, run: () => Promise<unknown>) => await run(),
);

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("navigator", { locks: { request } });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("chromeTokenPersistence", () => {
  it("리프레시 토큰을 chrome.storage.local 에 쓰고 읽는다", async () => {
    installChromeMock();

    await chromeTokenPersistence.setRefreshToken("rtk");
    await expect(chromeTokenPersistence.getRefreshToken()).resolves.toBe("rtk");

    await chromeTokenPersistence.setRefreshToken(null);
    await expect(chromeTokenPersistence.getRefreshToken()).resolves.toBeNull();
  });

  // 패널과 service worker 는 서로의 메모리를 못 보므로 자바스크립트 변수로는 막을 수 없다.
  // 둘이 같은 리프레시 토큰으로 동시에 재발급하면 RTR 이 뒤늦은 쪽을 거부해 양쪽이 로그아웃된다.
  it("재발급을 Web Locks 로 확장 전체에서 직렬화한다", async () => {
    installChromeMock();

    const run = vi.fn(async () => "done");
    await expect(chromeTokenPersistence.runExclusive?.(run)).resolves.toBe(
      "done",
    );

    expect(request).toHaveBeenCalledWith(expect.any(String), run);
  });
});
