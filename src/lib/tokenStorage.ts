import type { TokenPersistence } from "@shared/api";
import * as SecureStore from "expo-secure-store";

const REFRESH_TOKEN_KEY = "promise9_refresh_token";

export const tokenPersistence: TokenPersistence = {
  async getRefreshToken() {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },
  async setRefreshToken(token) {
    if (token) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
    } else {
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    }
  },
};
