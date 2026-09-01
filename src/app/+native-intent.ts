import { getShareExtensionKey } from "expo-share-intent";

// 공유 익스텐션이 여는 딥링크(promise9web://dataUrl=<key>)는 라우트 경로가 아니다 —
// 홈으로 보내고, 실제 이동은 ShareIntentRedirector 가 intent 를 읽어 처리한다.
export function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}) {
  try {
    if (path.includes(`dataUrl=${getShareExtensionKey()}`)) {
      return "/";
    }
    return path;
  } catch {
    return "/";
  }
}
