// expo-blur jest stub
// NativeBlurView 는 네이티브 뷰라 jest 에서 못 그린다 → 자식만 통과시키는 View 로 대체한다.
// 실제 blur 렌더는 device/web 으로 검증한다.
const React = require("react");
const { View } = require("react-native");

function BlurView({
  intensity,
  tint,
  blurMethod,
  experimentalBlurMethod,
  blurReductionFactor,
  blurTarget,
  children,
  ...props
}) {
  return React.createElement(View, props, children);
}

function BlurTargetView({ children, ...props }) {
  return React.createElement(View, props, children);
}

module.exports = { BlurView, BlurTargetView };
