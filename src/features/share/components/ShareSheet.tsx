import { useReduceMotion } from "@promise9/ui/hooks/useReduceMotion";
import { SheetHandle, SheetSurface } from "@promise9/ui/sheet/SheetChrome";
import {
  SHEET_BACKDROP_OPACITY,
  SHEET_SPRING,
} from "@promise9/ui/sheet/sheet.constants";
import type { PropsWithChildren } from "react";
import { createContext, useCallback, useContext, useMemo, useRef } from "react";
import {
  Animated,
  type LayoutChangeEvent,
  PanResponder,
  Pressable,
  ScrollView,
  type ScrollViewProps,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MemoFieldBase } from "@/features/link/components/MemoFieldBase";

// iOS 공유 익스텐션 전용 경량 시트. 익스텐션은 별도 프로세스라 메모리 상한이 있고,
// gorhom·keyboard-controller 가 끌어오는 Reanimated 만으로 +77MB 라 RN Animated 로 그린다.
// Android 는 메인 번들을 공유해 이점이 없어 gorhom 을 유지한다(ShareSheet.android.tsx).

const ShareSheetDismissContext = createContext<(() => void) | null>(null);

/** 퇴장 애니메이션 후 익스텐션을 닫는다. ShareSheet 자손에서만 호출 가능. */
export function useShareSheetDismiss() {
  const dismiss = useContext(ShareSheetDismissContext);
  if (!dismiss) {
    throw new Error("useShareSheetDismiss 는 ShareSheet 안에서만 쓸 수 있다.");
  }
  return dismiss;
}

export const ShareSheetView = View;
export const ShareSheetMemoField = MemoFieldBase;

// gorhom 스크롤뷰(Android)의 기본값처럼 스크롤을 끌어 내리면 키보드도 따라 내려간다.
export function ShareSheetScrollView(props: ScrollViewProps) {
  return <ScrollView keyboardDismissMode="interactive" {...props} />;
}

export interface ShareSheetProps extends PropsWithChildren {
  onClose: () => void;
  /** true 면 백드롭 탭·끌어 내리기로 닫히지 않는다(저장 중). */
  isLocked: boolean;
}

const DRAG_CLOSE_DISTANCE = 120;
const DRAG_CLOSE_VELOCITY = 1;
const DRAG_MIN_DISTANCE = 20;

export function shouldDismissByDrag(dy: number, vy: number) {
  if (dy >= DRAG_CLOSE_DISTANCE) return true;
  return dy >= DRAG_MIN_DISTANCE && vy >= DRAG_CLOSE_VELOCITY;
}

export function ShareSheet({ onClose, isLocked, children }: ShareSheetProps) {
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isReduceMotionEnabled = useReduceMotion();
  // 위치(아래로 내려간 거리)는 네이티브 드라이버로, 높이는 레이아웃 속성이라 JS 로 움직인다.
  const translateY = useRef(new Animated.Value(windowHeight)).current;
  const sheetHeight = useRef(new Animated.Value(0)).current;
  // 백드롭 농도의 기준 — 시트가 자기 높이만큼 내려가면(화면 밖) 0 이 된다.
  const backdropRange = useRef(new Animated.Value(windowHeight)).current;
  const measuredHeightRef = useRef<number | null>(null);
  const isClosingRef = useRef(false);

  const settle = useCallback(() => {
    if (isReduceMotionEnabled) {
      translateY.setValue(0);
      return;
    }
    Animated.spring(translateY, {
      toValue: 0,
      ...SHEET_SPRING,
      useNativeDriver: true,
    }).start();
  }, [translateY, isReduceMotionEnabled]);

  // 인앱 시트(gorhom)처럼 닫힐 때도 같은 스프링으로 내려간다.
  const dismiss = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    if (isReduceMotionEnabled) {
      onClose();
      return;
    }
    Animated.spring(translateY, {
      toValue: measuredHeightRef.current ?? windowHeight,
      ...SHEET_SPRING,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onClose();
    });
  }, [translateY, windowHeight, onClose, isReduceMotionEnabled]);

  // 콘텐츠가 바뀌면(확인 → 저장 → 결과, 리마인드 펼침) 잰 높이로 시트 높이를 따라 움직인다.
  // 처음 잰 뒤에 올라와야 빈 시트가 비치지 않는다.
  const handleContentLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { height } = event.nativeEvent.layout;
      const previousHeight = measuredHeightRef.current;
      if (height === previousHeight) return;
      measuredHeightRef.current = height;
      backdropRange.setValue(height);
      if (previousHeight === null) {
        sheetHeight.setValue(height);
        if (isClosingRef.current) return;
        translateY.setValue(height);
        settle();
        return;
      }
      if (isReduceMotionEnabled) {
        sheetHeight.setValue(height);
        return;
      }
      Animated.spring(sheetHeight, {
        toValue: height,
        ...SHEET_SPRING,
        useNativeDriver: false,
      }).start();
    },
    [backdropRange, sheetHeight, translateY, settle, isReduceMotionEnabled],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          !isLocked && !isClosingRef.current && gesture.dy > 4,
        // 등장·복귀 애니메이션 도중에 잡아도 그 자리에서 이어 끈다 — 위치는 네이티브가 들고 있어
        // 오프셋으로 넘겨받는다.
        onPanResponderGrant: () => {
          translateY.stopAnimation();
          translateY.extractOffset();
        },
        onPanResponderMove: (_, gesture) => {
          translateY.setValue(gesture.dy);
        },
        onPanResponderRelease: (_, gesture) => {
          translateY.flattenOffset();
          if (shouldDismissByDrag(gesture.dy, gesture.vy)) {
            dismiss();
          } else {
            settle();
          }
        },
        onPanResponderTerminate: () => {
          translateY.flattenOffset();
          settle();
        },
      }),
    [isLocked, translateY, dismiss, settle],
  );

  const { sheetTranslateY, backdropOpacity } = useMemo(
    () => ({
      // 위로 끌어 올려도 제자리 위로는 뜨지 않는다.
      sheetTranslateY: translateY.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
        extrapolateLeft: "clamp",
      }),
      backdropOpacity: Animated.divide(translateY, backdropRange).interpolate({
        inputRange: [0, 1],
        outputRange: [SHEET_BACKDROP_OPACITY, 0],
        extrapolate: "clamp",
      }),
    }),
    [translateY, backdropRange],
  );

  return (
    <ShareSheetDismissContext.Provider value={dismiss}>
      <View className="flex-1 justify-end">
        <Animated.View
          style={[StyleSheet.absoluteFill, { opacity: backdropOpacity }]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="시트 닫기"
            disabled={isLocked}
            onPress={dismiss}
            className="flex-1 bg-opacity-black-100"
          />
        </Animated.View>
        <Animated.View style={{ transform: [{ translateY: sheetTranslateY }] }}>
          <Animated.View testID="share-sheet" style={{ height: sheetHeight }}>
            <SheetSurface style={{ flex: 1 }}>
              {/* 시트 높이에 눌리지 않은 제 높이를 재려고 띄워 둔다(넘치면 상단 Safe Area 까지). */}
              <View
                onLayout={handleContentLayout}
                className="absolute inset-x-0 top-0"
                style={{ maxHeight: windowHeight - insets.top }}
              >
                <View testID="share-sheet-handle" {...panResponder.panHandlers}>
                  <SheetHandle />
                </View>
                {children}
              </View>
            </SheetSurface>
          </Animated.View>
        </Animated.View>
      </View>
    </ShareSheetDismissContext.Provider>
  );
}
