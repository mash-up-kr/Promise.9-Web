import { AppRegistry } from "react-native";

// ShareActivity 가 라우터(_layout)를 거치지 않아도 NativeWind 스타일이 잡히도록
// 등록 시점에 global.css 를 함께 로드한다(중복 로드는 무해).
import "@/global.css";
import { ShareExtension } from "./ShareExtension";

// Android 는 별도 번들 없이 메인 번들을 ShareActivity 가 공유한다 —
// 액티비티의 루트 컴포넌트("shareExtension")를 앱 기동 시 등록해 둔다.
AppRegistry.registerComponent("shareExtension", () => ShareExtension);
