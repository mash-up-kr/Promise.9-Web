import { Linking } from "react-native";

/**
 * 외부 URL(원문 링크 등)을 시스템에 맡겨 연다.
 * 실패는 개발 로깅만 — 사용자 노출 메시지는 호출부 스코프에서 다룬다.
 */
export async function openExternalUrl(url: string): Promise<void> {
  try {
    await Linking.openURL(url);
  } catch (error) {
    console.warn("링크를 열지 못했습니다", error);
  }
}
