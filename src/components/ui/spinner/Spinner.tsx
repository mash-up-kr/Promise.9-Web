import { LoaderCircle } from "lucide-react-native";
import { View } from "react-native";

import { Icon } from "@/components/ui/icon/Icon";

const SIZES = { small: 16, medium: 20, large: 24 } as const;
// SpinnerArc(순수 react-native-svg 래퍼)에는 className→color 매핑이 안 먹혀 raw hex 를 썼지만,
// lucide 아이콘은 Icon 컴포넌트의 styled() 매핑을 그대로 타므로 토큰 className 을 쓸 수 있다
// (Icon.test.tsx 가 이 매핑 자체를 검증한다 — 여기서는 재검증하지 않는다).
const TONES = {
  "on-light": "text-opacity-black-100",
  "on-dark": "text-opacity-white-100",
} as const;

export interface SpinnerProps {
  size?: keyof typeof SIZES;
  tone?: keyof typeof TONES;
}

// 회전은 Figma 정지 프레임에 없는 동작이라 코드에서 구현한다.
// Tailwind 기본 `animate-spin`(1s linear infinite, 스펙 0.8~1s 범위 내)을 그대로 쓴다.
// reanimated(withRepeat)는 웹에서 첫 프레임 이후 애니메이션 루프가 멈추는 현상이 있어
// (과거 SpinnerArc 구현에서 실측 확인) CSS 기반 유틸(animate-pulse 선례와 동일 경로)로 돌린다.
export function Spinner({ size = "small", tone = "on-light" }: SpinnerProps) {
  return (
    <View accessible accessibilityRole="progressbar" className="animate-spin">
      <Icon
        iconNode={LoaderCircle}
        size={SIZES[size]}
        className={TONES[tone]}
      />
    </View>
  );
}
