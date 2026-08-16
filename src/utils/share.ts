import * as Clipboard from "expo-clipboard";
import { Share } from "react-native";

import { isWeb } from "@/constants/platform.constants";

/** 공유 결과 — 클립보드로 폴백했으면 화면이 "복사했어요"를 알려야 한다. */
export type ShareResult = "shared" | "copied";

/**
 * URL 을 OS 공유 시트로 공유한다.
 *
 * 웹은 Web Share API 가 있는 브라우저(모바일 사파리·크롬)에서만 시트가 뜨고 데스크톱에는 없어서,
 * 없거나 실패하면 클립보드 복사로 폴백한다. 사용자가 시트를 닫은 것(AbortError)은 실패가 아니다.
 */
export async function shareUrl(url: string): Promise<ShareResult> {
  if (isWeb) {
    return shareOnWeb(url);
  }

  try {
    await Share.share({ message: url });

    return "shared";
  } catch {
    return copyToClipboard(url);
  }
}

async function shareOnWeb(url: string): Promise<ShareResult> {
  const share = globalThis.navigator?.share;
  if (!share) {
    return copyToClipboard(url);
  }

  try {
    await share.call(globalThis.navigator, { url });

    return "shared";
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return "shared";
    }

    return copyToClipboard(url);
  }
}

async function copyToClipboard(url: string): Promise<ShareResult> {
  await Clipboard.setStringAsync(url);

  return "copied";
}
