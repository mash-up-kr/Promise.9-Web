import { normalizeLinkUrl } from "@shared/link/link.utils";
import { Linking } from "react-native";

/**
 * 외부 URL(원문 링크 등)을 시스템에 맡겨 연다.
 * 저장 규칙에 맞지 않는 URL(스크립트 실행 스킴 등)은 열지 않는다 — 다른 경로로 저장된 링크도 있을 수 있다.
 * 실패는 개발 로깅만 — 사용자 노출 메시지는 호출부 스코프에서 다룬다.
 */
export async function openExternalUrl(url: string): Promise<void> {
  const safeUrl = normalizeLinkUrl(url);
  if (!safeUrl.ok) {
    console.warn("열 수 없는 링크입니다", url);
    return;
  }
  try {
    await Linking.openURL(safeUrl.url);
  } catch (error) {
    console.warn("링크를 열지 못했습니다", error);
  }
}
