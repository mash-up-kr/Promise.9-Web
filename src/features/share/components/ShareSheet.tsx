import type { PropsWithChildren } from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Animated,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  SheetHandle,
  SheetSurface,
} from "@/components/ui/bottom-sheet/SheetChrome";
import { MemoFieldBase } from "@/features/link/components/MemoFieldBase";

import { ShareSheetDismissContext } from "./shareSheet.context";

// iOS 공유 익스텐션 전용 경량 시트. 익스텐션은 별도 프로세스라 메모리 상한이 있고,
// gorhom·keyboard-controller 가 끌어오는 Reanimated 만으로 +77MB 라 RN Animated 로 그린다.
// Android 는 메인 번들을 공유해 이점이 없어 gorhom 을 유지한다(ShareSheet.android.tsx).

export { useShareSheetDismiss } from "./shareSheet.context";
export const ShareSheetView = View;
export const ShareSheetScrollView = ScrollView;
export const ShareSheetMemoField = MemoFieldBase;

export interface ShareSheetProps extends PropsWithChildren {
  onClose: () => void;
  /** true 면 백드롭 탭·끌어 내리기로 닫히지 않는다(저장 중). */
  isLocked: boolean;
}

// 인앱 BottomSheet 와 같은 enter spring.
const ENTER_SPRING = { stiffness: 420, damping: 40, overshootClamping: true };
const EXIT_DURATION = 220;
const BACKDROP_OPACITY = 0.6;
const DRAG_CLOSE_DISTANCE = 120;
const DRAG_CLOSE_VELOCITY = 1;
const DRAG_MIN_DISTANCE = 20;

export function shouldDismissByDrag(dy: number, vy: number) {
  if (dy >= DRAG_CLOSE_DISTANCE) return true;
  return dy >= DRAG_MIN_DISTANCE && vy >= DRAG_CLOSE_VELOCITY;
}

export function ShareSheet({ onClose, isLocked, children }: ShareSheetProps) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(height)).current;
  const isClosingRef = useRef(false);

  const settle = useCallback(() => {
    Animated.spring(translateY, {
      toValue: 0,
      ...ENTER_SPRING,
      useNativeDriver: true,
    }).start();
  }, [translateY]);

  useEffect(settle, [settle]);

  const dismiss = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    Animated.timing(translateY, {
      toValue: height,
      duration: EXIT_DURATION,
      useNativeDriver: true,
    }).start(() => onClose());
  }, [translateY, height, onClose]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          !isLocked && gesture.dy > 4,
        onPanResponderMove: (_, gesture) => {
          translateY.setValue(Math.max(0, gesture.dy));
        },
        onPanResponderRelease: (_, gesture) => {
          if (shouldDismissByDrag(gesture.dy, gesture.vy)) {
            dismiss();
          } else {
            settle();
          }
        },
        onPanResponderTerminate: settle,
      }),
    [isLocked, translateY, dismiss, settle],
  );

  const backdropOpacity = translateY.interpolate({
    inputRange: [0, height],
    outputRange: [BACKDROP_OPACITY, 0],
    extrapolate: "clamp",
  });

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
            className="flex-1 bg-black"
          />
        </Animated.View>
        <Animated.View
          style={{
            maxHeight: height - insets.top,
            transform: [{ translateY }],
          }}
        >
          <SheetSurface>
            <View {...panResponder.panHandlers}>
              <SheetHandle />
            </View>
            {children}
          </SheetSurface>
        </Animated.View>
      </View>
    </ShareSheetDismissContext.Provider>
  );
}
