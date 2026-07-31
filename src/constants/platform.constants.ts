import { Platform } from "react-native";

export const isIOS = Platform.OS === "ios";
export const isAndroid = Platform.OS === "android";
export const isWeb = Platform.OS === "web";
// RN 엔 server 개념이 없다 — 웹 번들이 window 없이 도는 곳은 SSG 프리렌더(빌드타임).
export const isServer = isWeb && typeof window === "undefined";
