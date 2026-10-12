import { installGlobal } from "expo/src/winter/installGlobal";

// iOS 공유 익스텐션 번들은 expo 를 import 하지 않아 앱처럼 WHATWG URL 이 깔리지 않는다 — RN 기본 URL 은
// 포트 범위·호스트 금지 문자를 보지 않고 "tel:123#" 에서 예외를 던져 링크 검증(z.url)이 서버와 어긋난다.
// expo 가 앱에 까는 구현(winter)만 가져온다. 내부 경로라 SDK 를 올릴 때 다시 확인한다.
// URL 구현(whatwg-url-minimum)은 불러올 때 TextEncoder·TextDecoder 를 만드는데, Hermes 엔 TextEncoder 만 있다.
installGlobal(
  "TextDecoder",
  () => require("expo/src/winter/TextDecoder").TextDecoder,
);
installGlobal("URL", () => require("expo/src/winter/url").URL);
installGlobal(
  "URLSearchParams",
  () => require("expo/src/winter/url").URLSearchParams,
);
