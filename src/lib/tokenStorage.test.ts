import * as SecureStore from "expo-secure-store";

jest.mock("@/constants/platform.constants", () => ({ isIOS: true }));

import { tokenPersistence } from "./tokenStorage";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const KEYCHAIN_OPTIONS = { accessGroup: "group.com.mashup.promise9" };

describe("tokenStorage (네이티브 — expo-secure-store)", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("getRefreshToken 은 SecureStore 에서 값을 읽는다", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue("stored-refresh");

    await expect(tokenPersistence.getRefreshToken()).resolves.toBe(
      "stored-refresh",
    );
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith(
      "promise9_refresh_token",
      KEYCHAIN_OPTIONS,
    );
  });

  it("setRefreshToken(값) 은 SecureStore 에 저장한다", async () => {
    await tokenPersistence.setRefreshToken("new-refresh");

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      "promise9_refresh_token",
      "new-refresh",
      KEYCHAIN_OPTIONS,
    );
  });

  it("setRefreshToken(null) 은 SecureStore 에서 삭제한다", async () => {
    await tokenPersistence.setRefreshToken(null);

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
      "promise9_refresh_token",
      KEYCHAIN_OPTIONS,
    );
  });
});

describe("tokenStorage (Android — 접근 그룹 없음)", () => {
  it("iOS 가 아니면 SecureStore 옵션을 넘기지 않는다", () => {
    jest.resetModules();
    const mockSecureStore = {
      getItemAsync: jest.fn().mockResolvedValue(null),
      setItemAsync: jest.fn(),
      deleteItemAsync: jest.fn(),
    };
    jest.doMock("expo-secure-store", () => mockSecureStore);
    jest.doMock("@/constants/platform.constants", () => ({ isIOS: false }));
    const { tokenPersistence: androidPersistence } = require("./tokenStorage");

    return androidPersistence.getRefreshToken().then(() => {
      expect(mockSecureStore.getItemAsync).toHaveBeenCalledWith(
        "promise9_refresh_token",
        undefined,
      );
    });
  });
});
