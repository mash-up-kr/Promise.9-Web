import { AppRegistry } from "react-native";

import { ShareExtension } from "./ShareExtension";

// Android 는 별도 번들 없이 메인 번들을 ShareActivity 가 공유한다 —
// 액티비티의 루트 컴포넌트("shareExtension")를 앱 기동 시 등록해 둔다.
AppRegistry.registerComponent("shareExtension", () => ShareExtension);
