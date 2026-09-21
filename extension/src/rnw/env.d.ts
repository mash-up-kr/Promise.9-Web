// 앱은 nativewind-env.d.ts 로 RN 컴포넌트에 className 타입을 붙인다 — 같은 소스를 검사하려면 여기도 필요하다.
/// <reference types="react-native-css/types" />

// react-native-web 은 타입을 배포하지 않는다.
declare module "react-native-web";
