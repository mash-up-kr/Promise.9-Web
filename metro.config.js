const { getDefaultConfig } = require("expo/metro-config");
const { withShareExtension } = require("expo-share-extension/metro");
const { withNativewind } = require("nativewind/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// 네이티브는 rem 을 컴파일 타임에 px 로 인라인하며 기본 배수가 14 라서
// 웹(브라우저 rem=16)과 크기가 어긋난다. 디자인 스펙(px)과 웹에 맞춰 16 으로 고정.
const pluginConfig = withShareExtension(
  withNativewind(config, { inlineRem: 16 }),
);

// react-native-css 리졸버는 `react-native` 를 자기 컴포넌트 진입점으로 바꾼다. 약한 참조
// (react-native-worklets 의 require.resolveWeak)까지 바뀌면 그래프에 없는 모듈을 가리켜
// 익스텐션 프로덕션 번들이 "Chunk containing module not found" 로 실패하므로 원본으로 해석한다.
const pluginResolveRequest = pluginConfig.resolver.resolveRequest;
pluginConfig.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === "react-native" &&
    context.dependency?.data?.asyncType === "weak"
  ) {
    return context.resolveRequest(context, moduleName, platform);
  }
  return pluginResolveRequest(context, moduleName, platform);
};

module.exports = pluginConfig;
