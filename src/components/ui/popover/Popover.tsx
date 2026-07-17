import { BlurView } from "expo-blur";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// 화면(safe-area) 기준 팝오버 위치.
// top 은 safe-area 상단에서의 offset, right/left 는 화면 가장자리에서의 여백.
export interface PopoverAnchor {
  top?: number;
  right?: number;
  left?: number;
}

export interface PopoverProps {
  // 트리거 요소. open() 을 눌렀을 때 팝오버가 열린다.
  trigger: (open: () => void) => React.ReactNode;
  // 팝오버 내용. close() 로 직접 닫을 수 있다.
  children: (close: () => void) => React.ReactNode;
  anchor: PopoverAnchor;
  width?: number;
  closeAccessibilityLabel?: string;
}

// 리퀴드 글래스 플로팅 패널 — safe-area 기준 고정 위치에 띄운다.
// 내부 항목(메뉴 등)은 children 으로 자유롭게 구성한다.
export function Popover({
  trigger,
  children,
  anchor,
  width,
  closeAccessibilityLabel = "메뉴 닫기",
}: PopoverProps) {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);

  const open = () => setVisible(true);
  const close = () => setVisible(false);

  const position = {
    top: insets.top + (anchor.top ?? 0),
    right: anchor.right,
    left: anchor.left,
  };

  return (
    <>
      {trigger(open)}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={close}
      >
        <Pressable
          accessibilityLabel={closeAccessibilityLabel}
          onPress={close}
          className="flex-1"
        >
          {/* 리퀴드 글래스 (Figma 레이어 순서): ①블러 → ②반투명 틴트 → ③내용 → ④inset 하이라이트.
              blur 는 expo-blur BlurView 로 처리 — iOS(UIVisualEffectView)·웹(backdrop-filter) 실블러. */}
          <View
            style={[position, width != null ? { width } : null]}
            className="absolute flex-col overflow-hidden rounded-[36px] py-5"
          >
            <BlurView
              intensity={30}
              tint="dark"
              pointerEvents="none"
              style={StyleSheet.absoluteFill}
            />
            {/* Figma fill: 블러 위에 얹는 반투명 회색 틴트. */}
            <View
              pointerEvents="none"
              style={StyleSheet.absoluteFill}
              className="bg-[rgba(101,101,107,0.1)]"
            />
            {children(close)}
            {/* Figma inset 하이라이트 — 내용 위 최상단 오버레이. */}
            <View
              pointerEvents="none"
              style={StyleSheet.absoluteFill}
              className="rounded-[36px] shadow-[inset_1px_1px_1px_0_var(--color-opacity-white-10),inset_3px_3px_38px_0_rgba(0,0,0,0.31),inset_0px_0px_2px_0_var(--color-opacity-white-40)]"
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
