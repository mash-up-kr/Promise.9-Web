import { View } from "react-native";

import type { SkeletonBlockProps } from "./SkeletonBlock";

// 웹은 CSS 유틸 `animate-pulse` 그대로 — 네이티브는 SkeletonBlock.tsx(RN Animated).
export function SkeletonBlock({ className, ...props }: SkeletonBlockProps) {
  return <View className={`animate-pulse ${className ?? ""}`} {...props} />;
}
