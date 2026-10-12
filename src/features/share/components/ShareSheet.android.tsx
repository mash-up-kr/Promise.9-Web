import { BottomSheetScrollView, BottomSheetView } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { BottomSheet } from "@/components/ui/bottom-sheet/BottomSheet";
import { MemoField } from "@/features/link/components/MemoField";

import type { ShareSheetProps } from "./ShareSheet";

// Android 공유 액티비티는 메인 번들·앱 프로세스를 공유해 Reanimated 가 이미 로드돼 있다 —
// 메모리 이점이 없으니 인앱과 같은 gorhom 시트를 쓴다(iOS 는 ShareSheet.tsx 경량 시트).

export { useSheetDismiss as useShareSheetDismiss } from "@/components/ui/bottom-sheet/useSheetDismiss";
export const ShareSheetView = BottomSheetView;
export const ShareSheetScrollView = BottomSheetScrollView;
export const ShareSheetMemoField = MemoField;

export function ShareSheet({
  onClose,
  isLocked,
  waitBeforeClose,
  children,
}: ShareSheetProps) {
  // Android 는 닫아도 앱 프로세스가 살아 있어 급하지 않다 — gorhom 이 내린 뒤에 기다린다.
  const handleClose = () =>
    waitBeforeClose ? waitBeforeClose(onClose) : onClose();

  return (
    // 앱 _layout 과 같은 루트 프로바이더 — 시트 제스처(gesture-handler)·Dialog 키보드 회피.
    <GestureHandlerRootView className="flex-1">
      <KeyboardProvider>
        <BottomSheet
          onClose={handleClose}
          backdropPressBehavior={isLocked ? "none" : "close"}
          isLocked={isLocked}
        >
          {children}
        </BottomSheet>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
