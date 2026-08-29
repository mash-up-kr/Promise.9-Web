import { onlineManager } from "@tanstack/react-query";
import * as Network from "expo-network";

import { isWeb } from "@/constants/platform.constants";

// 웹은 react-query 가 window online/offline 이벤트로 이미 복구를 감지한다 — 네이티브만 배선.
export function setupOnlineManager(): void {
  if (isWeb) return;
  onlineManager.setEventListener((setOnline) => {
    const subscription = Network.addNetworkStateListener((state) => {
      setOnline(state.isConnected ?? true);
    });
    return () => subscription.remove();
  });
}
