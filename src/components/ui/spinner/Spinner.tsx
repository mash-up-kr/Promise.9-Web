import { View } from "react-native";

import { SpinnerArc } from "./SpinnerArc";

const SIZES = { small: 16, medium: 20, large: 24 } as const;
const TONES = { "on-light": "#000000", "on-dark": "#ffffff" } as const;

export interface SpinnerProps {
  size?: keyof typeof SIZES;
  tone?: keyof typeof TONES;
}

// 회전은 Figma 정지 프레임에 없는 동작이라 코드에서 구현한다.
// Tailwind 기본 `animate-spin`(1s linear infinite, 스펙 0.8~1s 범위 내)을 그대로 쓴다.
// reanimated(withRepeat)로 직접 구현했다가 웹에서 첫 프레임 이후 애니메이션 루프가
// 멈추는 현상을 확인해 CSS 기반 유틸(react-native-css 컴파일 경로, animate-pulse 선례와 동일)로 교체했다.
export function Spinner({ size = "small", tone = "on-light" }: SpinnerProps) {
  return (
    <View accessible accessibilityRole="progressbar" className="animate-spin">
      <SpinnerArc size={SIZES[size]} color={TONES[tone]} />
    </View>
  );
}
