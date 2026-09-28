import { Platform } from "react-native";

export const isIOS = Platform.OS === "ios";
export const isAndroid = Platform.OS === "android";
export const isWeb = Platform.OS === "web";
// RN 엔 server 개념이 없다 — 웹 번들이 window 없이 도는 곳은 SSG 프리렌더(빌드타임).
export const isServer = isWeb && typeof window === "undefined";

// iOS 공유 익스텐션 플래그 — index.share.js 가 세운다.
declare global {
  var __promise9ShareExtension: boolean | undefined;
}

// 플래그는 모듈들을 불러온 뒤에 세워지므로 상수로 두지 않고 부를 때마다 읽는다.
export function isShareExtension(): boolean {
  return globalThis.__promise9ShareExtension === true;
}
