import type { ReactNode } from "react";
import { Pressable, StyleSheet } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

export interface DialogProps {
  children: ReactNode;
  /**
   * 배경(dim)을 눌러 닫는 동작. 넘기지 않으면 배경을 아예 그리지 않는다 —
   * 호출부가 배경을 직접 그리는 경우(AlertDialog) dim 이 두 겹이 되지 않게 한다.
   */
  onDismiss?: () => void;
  dismissAccessibilityLabel?: string;
}

/**
 * 화면 중앙 카드 오버레이의 공통 뼈대.
 *
 * **정렬 · dim · 키보드 회피만** 담당하고 카드 겉모습(글래스/솔리드·폭·radius)은 children 이
 * 정한다 — 알림과 폼은 카드 스타일이 다르지만 띄우는 방식은 같기 때문이다.
 * 오버레이 호스트(RN Modal)도 여기서 만들지 않는다: 라우트 화면은 이미 투명 모달이라
 * Modal 이 필요 없고, 화면 안에서 띄우는 쪽만 Modal 로 감싼다.
 *
 * children 은 화면을 채우는 컨테이너의 **직계 자식**으로 둔다 — 배경을 직접 그리는
 * 호출부(AlertDialog)가 `absoluteFill` 로 화면 전체를 덮을 수 있어야 하기 때문이다.
 * 래퍼를 한 겹 끼우면 그 배경의 기준이 카드 크기로 줄어 dim 도 탭 영역도 카드만 해진다.
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
