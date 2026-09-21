// 패키지·앱 코드가 `react-native` 로 받는 모듈. Metro 에서는 react-native-css 리졸버가
// `react-native-css/components` 로 바꿔치기하는데, 그 진입점은 lazy getter 로 짠 CJS 라
// 같은 매핑을 ESM 으로 직접 적는다. 이름이 겹치면 명시적 export 가 `export *` 를 이긴다.

export { ActivityIndicator } from "react-native-css/components/ActivityIndicator";
export { FlatList } from "react-native-css/components/FlatList";
export { Image } from "react-native-css/components/Image";
export { Pressable } from "react-native-css/components/Pressable";
export { ScrollView } from "react-native-css/components/ScrollView";
export { Text } from "react-native-css/components/Text";
export { TextInput } from "react-native-css/components/TextInput";
export { View } from "react-native-css/components/View";
export * from "react-native-web";
