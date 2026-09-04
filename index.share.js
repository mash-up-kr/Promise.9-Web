import { AppRegistry } from "react-native";

import "./src/global.css";

// iOS 공유 익스텐션에서는 Fabric 의 Dynamic Type 배율이 깨진 값으로 내려와
// allowFontScaling(기본 true)인 모든 텍스트의 fontSize 가 무효화된다(기본 14 로 렌더).
// Text.defaultProps 는 Fabric 에서 지원되지 않아, 이 플래그를 보고 ui/Text 와
// 익스텐션 자체 텍스트가 allowFontScaling 을 끈다 — 실측: 40 지정이 on/off 로 재현·해소.
globalThis.__promise9ShareExtension = true;

import { setTokenPersistence } from "./shared/api";
import { ShareExtension } from "./src/features/share/ShareExtension";
import { tokenPersistence } from "./src/lib/tokenStorage";

// 익스텐션 프로세스는 메인 앱 _layout 을 거치지 않는다 — 여기서 저장소를 주입해야
// 공유 키체인의 리프레시 토큰을 읽고, 로그인 결과도 남길 수 있다.
setTokenPersistence(tokenPersistence);

AppRegistry.registerComponent("shareExtension", () => ShareExtension);
