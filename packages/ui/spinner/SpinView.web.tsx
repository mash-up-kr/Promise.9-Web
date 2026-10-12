import type { PropsWithChildren } from "react";
import { View } from "react-native";

// Tailwind 기본 `animate-spin`(1s linear infinite) — reanimated(withRepeat)는 웹에서 첫 프레임 이후
// 애니메이션 루프가 멈추는 현상이 있어(과거 SpinnerArc 구현에서 실측 확인) CSS 유틸로 돌린다.
export function SpinView({ children }: PropsWithChildren) {
  return <View className="animate-spin">{children}</View>;
}
