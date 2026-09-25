import {
  close as closeExtension,
  openHostApp as openHostAppFromExtension,
} from "expo-share-extension";

import { runAfterPendingWork } from "./runAfterPendingWork";

// iOS: Share Extension 프로세스 제어는 expo-share-extension 이 제공한다.
// Android 구현은 shareHost.android.ts (전용 ShareActivity + 로컬 ShareHost 모듈).
// iOS 는 둘 다 끝나면 네이티브가 곧 프로세스를 종료한다 — 진행 중인 토큰 재발급이 끝난 뒤에 부른다.

export function close() {
  runAfterPendingWork(closeExtension);
}

export function openHostApp(path: string) {
  runAfterPendingWork(() => openHostAppFromExtension(path));
}
