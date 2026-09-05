import { requireNativeModule } from "expo";
import { Linking } from "react-native";

// app.json scheme 과 동일해야 한다 — MainActivity 딥링크로 앱을 연다.
const APP_SCHEME = "promise9web";

// 이 파일은 앱 시작 경로(index.js → 공유 등록)에 포함된다 — 모듈 로드 시점에 네이티브를 요구하면
// 새 모듈이 없는 예전 빌드에서 공유가 아닌 앱 전체가 시작 시 죽는다. 호출 시점에만 찾는다.
function getShareHost() {
  return requireNativeModule<{ close(): void }>("ShareHost");
}

/** 공유 액티비티를 닫고 공유를 시작한 앱으로 돌아간다. */
export function close() {
  getShareHost().close();
}

/** 본 앱을 딥링크로 연 뒤 공유 액티비티를 닫는다. */
export function openHostApp(path: string) {
  Linking.openURL(`${APP_SCHEME}://${path}`).finally(() => {
    getShareHost().close();
  });
}
