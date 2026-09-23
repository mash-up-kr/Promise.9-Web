import { BottomSheetScrollView, BottomSheetView } from "@gorhom/bottom-sheet";
import type { PropsWithChildren } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { BottomSheet } from "@/components/ui/bottom-sheet/BottomSheet";
import { useSheetDismiss } from "@/components/ui/bottom-sheet/useSheetDismiss";
import { MemoField } from "@/features/link/components/MemoField";

import type { ShareSheetProps } from "./ShareSheet";
import { ShareSheetDismissContext } from "./shareSheet.context";

// Android 공유 액티비티는 메인 번들·앱 프로세스를 공유해 Reanimated 가 이미 로드돼 있다 —
// 메모리 이점이 없으니 인앱과 같은 gorhom 시트를 쓴다(iOS 는 ShareSheet.tsx 경량 시트).

export { useShareSheetDismiss } from "./shareSheet.context";
export const ShareSheetView = BottomSheetView;
export const ShareSheetScrollView = BottomSheetScrollView;
export const ShareSheetMemoField = MemoField;

export function ShareSheet({ onClose, isLocked, children }: ShareSheetProps) {
  return (
    // 앱 _layout 과 같은 루트 프로바이더 — 시트 제스처(gesture-handler)·Dialog 키보드 회피.
    <GestureHandlerRootView className="flex-1">
      <KeyboardProvider>
        <BottomSheet
          onClose={onClose}
          backdropPressBehavior={isLocked ? "none" : "close"}
          isLocked={isLocked}
        >
          <DismissProvider>{children}</DismissProvider>
        </BottomSheet>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

function DismissProvider({ children }: PropsWithChildren) {
  const dismiss = useSheetDismiss();
  return (
    <ShareSheetDismissContext.Provider value={dismiss}>
      {children}
    </ShareSheetDismissContext.Provider>
  );
}
