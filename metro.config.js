const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// 네이티브는 rem 을 컴파일 타임에 px 로 인라인하며 기본 배수가 14 라서
// 웹(브라우저 rem=16)과 크기가 어긋난다. 디자인 스펙(px)과 웹에 맞춰 16 으로 고정.
module.exports = withNativewind(config, { inlineRem: 16 });
