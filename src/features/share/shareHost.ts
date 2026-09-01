// iOS: Share Extension 프로세스 제어는 expo-share-extension 이 제공한다.
// Android 구현은 shareHost.android.ts (전용 ShareActivity + 로컬 ShareHost 모듈).
export { close, openHostApp } from "expo-share-extension";
