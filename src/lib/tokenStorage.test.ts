import * as SecureStore from "expo-secure-store";

import { tokenPersistence } from "./tokenStorage";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

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
    );
  });

  it("setRefreshToken(값) 은 SecureStore 에 저장한다", async () => {
    await tokenPersistence.setRefreshToken("new-refresh");

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      "promise9_refresh_token",
      "new-refresh",
    );
  });

  it("setRefreshToken(null) 은 SecureStore 에서 삭제한다", async () => {
    await tokenPersistence.setRefreshToken(null);

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
      "promise9_refresh_token",
    );
  });
});
