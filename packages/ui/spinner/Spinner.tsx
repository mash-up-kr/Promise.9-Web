import { LoaderCircle } from "lucide-react-native";
import { View } from "react-native";

import { Icon } from "../icon/Icon";

import { SpinView } from "./SpinView";

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

// 회전은 Figma 정지 프레임에 없는 동작이라 코드에서 구현한다 — 1s linear infinite(스펙 0.8~1s 범위 내).
export function Spinner({ size = "small", tone = "on-light" }: SpinnerProps) {
  return (
    <View accessible accessibilityRole="progressbar">
      <SpinView>
        <Icon
          iconNode={LoaderCircle}
          size={SIZES[size]}
          className={TONES[tone]}
        />
      </SpinView>
    </View>
  );
}
