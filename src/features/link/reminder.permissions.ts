import * as Notifications from "expo-notifications";

import { isWeb } from "@/constants/platform.constants";

// 미요청(undetermined) 상태에서만 OS 다이얼로그를 띄운다. 거부 결과는 무시한다 —
// 푸시가 거부돼도 이메일 리마인드가 동작하므로 토글을 막지 않는다(시안 정책).
export async function requestReminderPermission(): Promise<void> {
  // 공유 익스텐션 프로세스는 OS 권한 다이얼로그를 띄울 수 없다.
  if (isWeb || globalThis.__promise9ShareExtension) return;
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.status === "undetermined") {
      await Notifications.requestPermissionsAsync();
    }
  } catch (error) {
    console.error(error);
  }
}
