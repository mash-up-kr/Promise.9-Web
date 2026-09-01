import { requireNativeModule } from "expo";
import { Linking } from "react-native";

// app.json scheme 과 동일해야 한다 — MainActivity 딥링크로 앱을 연다.
const APP_SCHEME = "promise9web";

const ShareHost = requireNativeModule<{ close(): void }>("ShareHost");

/** 공유 액티비티를 닫고 공유를 시작한 앱으로 돌아간다. */
export function close() {
  ShareHost.close();
}

/** 본 앱을 딥링크로 연 뒤 공유 액티비티를 닫는다. */
export function openHostApp(path: string) {
  Linking.openURL(`${APP_SCHEME}://${path}`).finally(() => {
    ShareHost.close();
  });
}
