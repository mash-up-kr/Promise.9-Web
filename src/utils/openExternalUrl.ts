import { isOpenableLinkUrl } from "@shared/link/link.utils";
import { Linking } from "react-native";

type OpenExternalUrlResult = "opened" | "blocked" | "failed";

/**
 * 외부 URL(원문 링크 등)을 시스템에 맡겨 연다.
 * 위험한 스킴·보이지 않는 문자가 든 URL 은 열지 않는다 — 다른 경로로 저장된 링크도 있을 수 있다.
 * 결과만 돌려주고, 사용자 노출 메시지는 호출부 스코프에서 다룬다.
 */
export async function openExternalUrl(
  url: string,
): Promise<OpenExternalUrlResult> {
  if (!isOpenableLinkUrl(url)) {
    console.warn("열 수 없는 링크입니다", url);
    return "blocked";
  }
  try {
    // 웹(react-native-web)은 새 창을 열기만 하고 성공으로 끝낸다 — 열 앱이 없어도 실패를 알 수 없다.
    await Linking.openURL(url);
    return "opened";
  } catch (error) {
    console.warn("링크를 열지 못했습니다", error);
    return "failed";
  }
}
