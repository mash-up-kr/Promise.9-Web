import { BlurView } from "expo-blur";
import { useRef, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CONTENT_MAX_WIDTH } from "@/constants/layout.constants";
import { isIOS } from "@/constants/platform.constants";

import { type PopoverTriggerRect, resolvePopoverTop } from "./popover.utils";

// 웹에서 앱 콘텐츠는 중앙 컬럼(_layout.tsx)이지만, Modal 은 그 컬럼을 벗어나 전체 윈도우에 뜬다.
// 그래서 화면 가장자리(right/left) 기준 anchor 를 중앙 컬럼 가장자리에 맞추도록,
// 윈도우가 컬럼 폭보다 넓을 때 좌우 여백만큼 offset 을 더한다.

/** 트리거 하단과 팝오버 사이 기본 간격. */
const DEFAULT_GAP = 8;

// 팝오버의 가로 위치. 세로는 트리거를 재서 그 아래에 붙이므로 지정하지 않는다.
export interface PopoverAnchor {
  right?: number;
  left?: number;
}

export interface PopoverProps {
  // 트리거 요소. open() 을 눌렀을 때 팝오버가 열린다.
  trigger: (open: () => void) => React.ReactNode;
  // 팝오버 내용. close() 로 직접 닫을 수 있다.
  children: (close: () => void) => React.ReactNode;
  anchor: PopoverAnchor;
  /** 트리거 하단과의 간격. 기본 8. */
  gap?: number;
  width?: number;
  closeAccessibilityLabel?: string;
  /**
   * 팝오버가 완전히 닫힌 뒤 호출된다.
   *
   * iOS 는 Modal 이 사라지는 도중에 다른 Modal 을 띄우면 그 Modal 이 아예 나타나지 않는다.
   * 메뉴 항목이 다이얼로그·시트를 여는 경우 그 동작을 이 시점까지 미뤄야 한다.
   */
  onClosed?: () => void;
}

// 리퀴드 글래스 플로팅 패널 — 트리거 바로 아래에 띄운다(아래 공간이 모자라면 위로 뒤집는다).
// 내부 항목(메뉴 등)은 children 으로 자유롭게 구성한다.
export function Popover({
  trigger,
  children,
  anchor,
  gap = DEFAULT_GAP,
  width,
  closeAccessibilityLabel = "메뉴 닫기",
  onClosed,
}: PopoverProps) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [visible, setVisible] = useState(false);
  const triggerRef = useRef<View>(null);
  const [triggerRect, setTriggerRect] = useState<PopoverTriggerRect | null>(
    null,
  );
  const [panelHeight, setPanelHeight] = useState<number | null>(null);

  // measureInWindow 만이 화면 절대 좌표를 준다(onLayout 은 부모 기준이라 못 쓴다).
  // 환경에 따라 없을 수도 있어 optional call 로 둔다.
  const measureTrigger = () => {
    triggerRef.current?.measureInWindow?.((_x, y, _width, height) => {
      setTriggerRect({ top: y, height });
    });
  };

  // 측정은 비동기라 결과를 기다리지 않고 연다 — 좌표가 오면 위치만 갱신된다.
  // (레이아웃 때 이미 한 번 재두므로 보통은 첫 프레임부터 제자리에 뜬다.)
  const open = () => {
    setVisible(true);
    measureTrigger();
  };
  // Modal 의 onDismiss 는 iOS 전용(사라짐 애니메이션이 끝난 뒤 호출)이다. 다른 플랫폼은
  // 애니메이션 중 Modal 중첩 문제가 없으므로 닫는 즉시 알린다.
  const close = () => {
    setVisible(false);
    if (!isIOS) onClosed?.();
  };

  // 중앙 컬럼과 윈도우 가장자리 사이 여백. 모바일(윈도우 ≤ 컬럼 폭)에서는 0 이라 영향 없다.
  const edgeInset = Math.max(0, (windowWidth - CONTENT_MAX_WIDTH) / 2);
  const position = {
    top: resolvePopoverTop({
      trigger: triggerRect,
      panelHeight,
      windowHeight,
      safeAreaTop: insets.top,
      safeAreaBottom: insets.bottom,
      gap,
    }),
    right: anchor.right != null ? anchor.right + edgeInset : undefined,
    left: anchor.left != null ? anchor.left + edgeInset : undefined,
  };

  return (
    <>
      <View ref={triggerRef} collapsable={false} onLayout={measureTrigger}>
        {trigger(open)}
      </View>
      <Modal
        testID="popover-overlay"
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={close}
        onDismiss={isIOS ? onClosed : undefined}
      >
        <Pressable
          accessibilityLabel={closeAccessibilityLabel}
          onPress={close}
          className="flex-1"
        >
          {/* 리퀴드 글래스 (Figma 레이어 순서): ①블러 → ②반투명 틴트 → ③내용 → ④inset 하이라이트.
              blur 는 expo-blur BlurView 로 처리 — iOS(UIVisualEffectView)·웹(backdrop-filter) 실블러. */}
          <View
            testID="popover-panel"
            style={[position, width != null ? { width } : null]}
            onLayout={(event) =>
              setPanelHeight(event.nativeEvent.layout.height)
            }
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
