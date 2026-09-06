import { BottomSheetView } from "@gorhom/bottom-sheet";
import type { PropsWithChildren } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// 결과·로그인·확인 시트의 본문 틀 — gorhom 동적 사이징이 콘텐츠 높이를 재도록 BottomSheetView 로 감싼다.
// 시트 크롬(배경·핸들·백드롭)은 인앱 BottomSheet 가 그린다.
export function SheetBody({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();
  return (
    <BottomSheetView
      className="px-5"
      style={{ paddingBottom: insets.bottom + 16 }}
    >
      {children}
    </BottomSheetView>
  );
}
