import type { PropsWithChildren } from "react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { Animated, Easing, PanResponder, Pressable, View } from "react-native";

import { isAndroid } from "@/constants/platform.constants";

// 시트 등장·퇴장 모션 값 — dim 은 슬라이드가 아니라 페이드로 나타나고,
// 닫힐 때는 시트가 먼저 내려간 뒤 스르륵 사라진다(iOS dim 은 시스템 프레젠테이션 담당).
const SHEET_ENTER_MS = 260;
const SHEET_EXIT_MS = 220;
// iOS 시트는 네이티브가 고정한 컨테이너(app.json expo-share-extension height) 를 꽉 채우므로,
// 슬라이드 거리는 논리 높이(400·520)가 아니라 이 값이어야 화면 밖까지 완전히 나간다.
const IOS_SHEET_CONTAINER_HEIGHT = 600;
const DIM_FADE_MS = 180;
const DRAG_DISMISS_DISTANCE = 120;
const DRAG_DISMISS_VELOCITY = 0.8;

export interface ShareSheetHandle {
  dismiss: () => void;
}

export interface ShareSheetContainerProps {
  height: number;
  onClosed: () => void;
}

// iOS 는 익스텐션 컨테이너(높이 고정)가 곧 시트 영역이고, Android 는 반투명 액티비티
// 전체 위에 딤 + 하단 시트를 직접 그린다. 양쪽 모두 시트 슬라이드·상단 스와이프 다운은
// 여기서 담당한다(탭 아웃 닫기는 Android 전용 — iOS 는 시트 밖이 호스트 앱 영역).
export const ShareSheetContainer = forwardRef<
  ShareSheetHandle,
  PropsWithChildren<ShareSheetContainerProps>
>(function ShareSheetContainer({ height, onClosed, children }, ref) {
  const slideDistance = isAndroid ? height : IOS_SHEET_CONTAINER_HEIGHT;
  const sheetY = useRef(new Animated.Value(slideDistance)).current;
  const dimOpacity = useRef(new Animated.Value(0)).current;
  const slideDistanceRef = useRef(slideDistance);
  slideDistanceRef.current = slideDistance;
  // 퇴장은 한 번만 — 스와이프 중 탭아웃처럼 겹치면 첫 애니메이션이 중단된 채 닫혀 시트가 반쯤 남는다.
  const isClosingRef = useRef(false);

  useEffect(
    function enterAnimation() {
      Animated.timing(sheetY, {
        toValue: 0,
        duration: SHEET_ENTER_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      if (isAndroid) {
        Animated.timing(dimOpacity, {
          toValue: 1,
          duration: DIM_FADE_MS,
          useNativeDriver: true,
        }).start();
      }
    },
    [sheetY, dimOpacity],
  );

  const dismiss = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    Animated.timing(sheetY, {
      toValue: slideDistanceRef.current,
      duration: SHEET_EXIT_MS,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      if (!isAndroid) {
        onClosed();
        return;
      }
      Animated.timing(dimOpacity, {
        toValue: 0,
        duration: DIM_FADE_MS,
        useNativeDriver: true,
      }).start(() => onClosed());
    });
  }, [sheetY, dimOpacity, onClosed]);

  useImperativeHandle(ref, () => ({ dismiss }), [dismiss]);

  const dismissRef = useRef(dismiss);
  dismissRef.current = dismiss;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        gesture.dy > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderMove: (_, gesture) => {
        if (!isClosingRef.current && gesture.dy > 0) {
          sheetY.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (isClosingRef.current) return;
        if (
          gesture.dy > DRAG_DISMISS_DISTANCE ||
          gesture.vy > DRAG_DISMISS_VELOCITY
        ) {
          dismissRef.current();
          return;
        }
        Animated.timing(sheetY, {
          toValue: 0,
          duration: 160,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      },
    }),
  ).current;

  const sheet = (
    <Animated.View
      className={isAndroid ? "overflow-hidden rounded-t-3xl" : "flex-1"}
      style={[
        isAndroid ? { height } : null,
        { transform: [{ translateY: sheetY }] },
      ]}
    >
      {children}
      {/* 핸들 영역(8+4+12pt)만 덮는다 — 헤더 버튼(24pt 부터)까지 덮으면 그 윗부분 탭이 먹지 않는다. */}
      <View
        accessibilityLabel="시트 끌어서 닫기"
        className="absolute top-0 right-0 left-0 h-6"
        {...panResponder.panHandlers}
      />
    </Animated.View>
  );

  if (!isAndroid) {
    return sheet;
  }
  return (
    <View className="flex-1 justify-end">
      <Animated.View
        className="absolute inset-0 bg-opacity-black-50"
        style={{ opacity: dimOpacity }}
      />
      <Pressable
        accessibilityLabel="닫기"
        className="absolute inset-0"
        onPress={() => dismissRef.current()}
      />
      {sheet}
    </View>
  );
});
