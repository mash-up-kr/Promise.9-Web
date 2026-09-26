import { openHostApp as openHostAppFromExtension } from "expo-share-extension";

import { runAfterPendingWork } from "./runAfterPendingWork";

// iOS: Share Extension 프로세스 제어는 expo-share-extension 이 제공한다.
// Android 구현은 shareHost.android.ts (전용 ShareActivity + 로컬 ShareHost 모듈).
// 닫기는 시트가 이미 진행 중인 작업을 기다린 뒤 부른다(ShareSheet waitBeforeClose).
export { close } from "expo-share-extension";

// 앱을 열면 네이티브가 곧 프로세스를 종료한다 — 진행 중인 토큰 재발급이 끝난 뒤에 연다.
export function openHostApp(path: string) {
  runAfterPendingWork(() => openHostAppFromExtension(path));
}
