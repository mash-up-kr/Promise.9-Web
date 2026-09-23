import type { PropsWithChildren } from "react";
import { type StyleProp, View, type ViewStyle } from "react-native";

// gorhom 을 import 하지 않는 시트 외형 — gorhom 을 쓸 수 없는 iOS 공유 익스텐션 시트도 같은 모양을 쓴다.

export interface SheetSurfaceProps extends PropsWithChildren {
  style?: StyleProp<ViewStyle>;
}

// Figma Sheet Container: gray-900 솔리드 + 상단 radius 24 + 위쪽 그림자.
export function SheetSurface({ style, children }: SheetSurfaceProps) {
  return (
    <View
      style={style}
      className="shrink overflow-hidden rounded-t-3xl bg-gray-900 shadow-[0px_-8px_24px_0px_rgba(0,0,0,0.35)]"
    >
      {children}
    </View>
  );
}

export function SheetHandle() {
  return (
    <View className="items-center pt-2 pb-1">
      <View className="h-1 w-9 rounded-full bg-icon-assistive" />
    </View>
  );
}
