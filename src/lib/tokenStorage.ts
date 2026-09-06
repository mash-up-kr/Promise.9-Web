import type { TokenPersistence } from "@shared/api";
import * as SecureStore from "expo-secure-store";

import { isIOS } from "@/constants/platform.constants";

const REFRESH_TOKEN_KEY = "promise9_refresh_token";

// iOS 공유 익스텐션과 같은 키체인 항목을 보도록 App Group 을 접근 그룹으로 쓴다
// (app.json expo-share-extension 기본 App Group 과 같은 값).
const KEYCHAIN_OPTIONS: SecureStore.SecureStoreOptions | undefined = isIOS
  ? { accessGroup: "group.com.mashup.promise9" }
  : undefined;

export const tokenPersistence: TokenPersistence = {
  async getRefreshToken() {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY, KEYCHAIN_OPTIONS);
  },
  async setRefreshToken(token) {
    if (token) {
      await SecureStore.setItemAsync(
        REFRESH_TOKEN_KEY,
        token,
        KEYCHAIN_OPTIONS,
      );
    } else {
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY, KEYCHAIN_OPTIONS);
    }
  },
};
