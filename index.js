// Android ShareActivity 는 "shareExtension" 루트를 곧바로 시작하므로,
// 라우터가 평가되기 전(엔트리)에 등록돼 있어야 한다. (iOS 는 noop — index.share.js 가 담당)
import "./src/features/share/shareExtension.registry";
import "expo-router/entry";
