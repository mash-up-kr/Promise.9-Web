import { KeyboardAvoidingView, Pressable, StyleSheet } from "react-native";

import type { DialogProps } from "./Dialog";

/**
 * iOS 판 Dialog — 뼈대·계약은 Dialog.tsx 와 같다.
 *
 * keyboard-controller 는 Android edge-to-edge 키보드 회피 때문에 쓰는데, 그 패키지가
 * Reanimated 를 끌어와 iOS 공유 익스텐션 메모리 상한을 넘긴다(shareExtension.bundle.test).
 * iOS 는 RN 기본 KeyboardAvoidingView 로 충분하다.
 */
export function Dialog({
  children,
  onDismiss,
  dismissAccessibilityLabel = "닫기",
}: DialogProps) {
  return (
    <KeyboardAvoidingView
      behavior="padding"
      className="flex-1 items-center justify-center px-5"
    >
      {onDismiss ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={dismissAccessibilityLabel}
          onPress={onDismiss}
          style={StyleSheet.absoluteFill}
          className="bg-opacity-black-50"
        />
      ) : null}
      {children}
    </KeyboardAvoidingView>
  );
}
