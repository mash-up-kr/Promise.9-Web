import { AppRegistry } from "react-native";

import "./src/global.css";

// 익스텐션 프로세스에서는 커스텀 폰트 Text 가 그려지지 않아(ui/Text 주석 참고)
// 폰트 클래스를 걷어내도록 전역 플래그를 세운다 — 첫 렌더 전에만 세워지면 된다.
globalThis.__promise9ShareExtension = true;

import { ShareExtension } from "./src/features/share/ShareExtension";

AppRegistry.registerComponent("shareExtension", () => ShareExtension);
