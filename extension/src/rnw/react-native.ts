// 패키지·앱 코드가 `react-native` 로 받는 모듈. Metro 에서는 react-native-css 리졸버가
// `react-native-css/components` 로 바꿔치기하는데, 그 진입점은 lazy getter 로 짠 CJS 라
// 같은 매핑을 ESM 으로 직접 적는다. 이름이 겹치면 명시적 export 가 `export *` 를 이긴다.
//
// 목록은 react-native-css/components 가 감싸는 것과 같아야 한다 — 빠진 컴포넌트는 react-native-web
// 원본으로 떨어져 className 을 조용히 버린다(앱에선 스타일이 먹고 익스텐션에서만 안 먹는다).
// 안 쓰는 래퍼가 번들에 남지 않도록 vite.config.ts 가 이 모듈들을 side-effect-free 로 표시한다.

export { ActivityIndicator } from "react-native-css/components/ActivityIndicator";
export { Button } from "react-native-css/components/Button";
export { FlatList } from "react-native-css/components/FlatList";
export { Image } from "react-native-css/components/Image";
export { ImageBackground } from "react-native-css/components/ImageBackground";
export { KeyboardAvoidingView } from "react-native-css/components/KeyboardAvoidingView";
export { Pressable } from "react-native-css/components/Pressable";
export { ScrollView } from "react-native-css/components/ScrollView";
export { Switch } from "react-native-css/components/Switch";
export { Text } from "react-native-css/components/Text";
export { TextInput } from "react-native-css/components/TextInput";
export { TouchableHighlight } from "react-native-css/components/TouchableHighlight";
export { TouchableOpacity } from "react-native-css/components/TouchableOpacity";
export { TouchableWithoutFeedback } from "react-native-css/components/TouchableWithoutFeedback";
export { View } from "react-native-css/components/View";
export { VirtualizedList } from "react-native-css/components/VirtualizedList";
export * from "react-native-web";
