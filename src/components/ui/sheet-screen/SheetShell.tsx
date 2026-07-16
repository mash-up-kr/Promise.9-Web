import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { SheetShellProps } from "./sheet-screen.types";

// 네이티브 시트 껍데기. OS formSheet(src/app/_layout.tsx) 가 둥근 모서리·그래버·스와이프
// dismiss 를 그려주므로 배경 View 만 둔다. onClose 는 웹 전용이라 여기선 미사용.
//
// 리퀴드 글래스로 바꾸려면: 이 View 를 투명 배경 + BlurView 레이어로 교체하고,
// _layout.tsx 의 시트 옵션에 dim 해제(sheetLargestUndimmedDetentIndex)를 추가하면
// SheetScreen 을 쓰는 모든 시트에 반영된다.
export function SheetShell({ children }: SheetShellProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      className="flex-1 bg-background-base px-5"
      style={{ paddingBottom: insets.bottom + 16 }}
    >
      {children}
    </View>
  );
}
