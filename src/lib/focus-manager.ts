import { focusManager } from "@tanstack/react-query";
import { AppState, type AppStateStatus } from "react-native";

import { isWeb } from "@/constants/platform.constants";

// 웹은 react-query 가 visibilitychange 로 포커스 복귀를 감지한다 — 네이티브만 AppState 로 배선.
// 공유 익스텐션(별도 프로세스)에서 저장하고 앱으로 돌아오면 화면 쿼리가 다시 조회된다.
export function setupFocusManager(): void {
  if (isWeb) return;
  focusManager.setEventListener((handleFocus) => {
    const subscription = AppState.addEventListener(
      "change",
      (status: AppStateStatus) => handleFocus(status === "active"),
    );
    return () => subscription.remove();
  });
}
