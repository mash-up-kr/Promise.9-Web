import { useReduceMotion } from "@promise9/ui/hooks/useReduceMotion";
import { SheetHandle, SheetSurface } from "@promise9/ui/sheet/SheetChrome";
import {
  SHEET_BACKDROP_OPACITY,
  SHEET_SPRING,
} from "@promise9/ui/sheet/sheet.constants";
import type { PropsWithChildren, ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  type GestureResponderHandlers,
  type LayoutChangeEvent,
  PanResponder,
  Pressable,
  ScrollView,
  type ScrollViewProps,
  StyleSheet,
  useWindowDimensions,
  View,
  type ViewProps,
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

// 핸들 말고도 스크롤이 없는 곳(본문 시트·스크롤 시트의 헤더)을 끌면 시트가 움직인다 — gorhom 과 같다.
// 스크롤 영역은 네이티브 스크롤이 제스처를 가져가므로 붙이지 않는다.
const ShareSheetPanContext = createContext<
  GestureResponderHandlers | undefined
>(undefined);

export function ShareSheetView(props: ViewProps) {
  const panHandlers = useContext(ShareSheetPanContext);
  return <View {...panHandlers} {...props} />;
}

export const ShareSheetMemoField = MemoFieldBase;

export interface ShareSheetScrollViewProps extends ScrollViewProps {
  /** 스크롤 위에 고정되는 헤더 — 끌어서 시트를 내릴 수 있다. */
  header?: ReactNode;
}

// gorhom 스크롤뷰(Android)의 기본값처럼 스크롤을 끌어 내리면 키보드도 따라 내려간다.
export function ShareSheetScrollView({
  header,
  ...props
}: ShareSheetScrollViewProps) {
  const panHandlers = useContext(ShareSheetPanContext);
  return (
    <>
      {header ? <View {...panHandlers}>{header}</View> : null}
      <ScrollView keyboardDismissMode="interactive" {...props} />
    </>
  );
}

export interface ShareSheetProps extends PropsWithChildren {
  onClose: () => void;
  /** true 면 백드롭 탭·끌어 내리기로 닫히지 않는다(저장 중). */
  isLocked: boolean;
  /** 닫기 전에 끝나야 할 일을 기다렸다가 proceed 를 부른다 — 그동안 시트는 떠 있고 조작을 막는다. */
  waitBeforeClose?: (proceed: () => void) => void;
}

// PanResponder 속도(px/ms)를 스프링 속도(px/s)로 바꾸고, gorhom 처럼 절반만 이어받는다.
const RELEASE_VELOCITY_SCALE = 1000 / 2;
// 애니메이션이 끝났다는 신호가 오지 않아도 시트가 멈춰 있지 않도록 거는 시한.
const ENTRANCE_DEADLINE_MS = 1000;
// 닫기 전 대기(최대 5초)와 퇴장 애니메이션을 넉넉히 넘긴다.
const CLOSE_DEADLINE_MS = 7000;
const DRAG_CLOSE_DISTANCE = 120;
const DRAG_CLOSE_VELOCITY = 1;
const DRAG_MIN_DISTANCE = 20;

type EntranceState = "waiting" | "entering" | "entered";

export function shouldDismissByDrag(dy: number, vy: number) {
  if (dy >= DRAG_CLOSE_DISTANCE) return true;
  return dy >= DRAG_MIN_DISTANCE && vy >= DRAG_CLOSE_VELOCITY;
}

export function ShareSheet({
  onClose,
  isLocked,
  waitBeforeClose,
  children,
}: ShareSheetProps) {
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // null 이면 아직 모른다 — 첫 등장은 설정을 읽은 뒤로 미룬다.
  const reduceMotion = useReduceMotion();
  const isReduceMotionEnabled = reduceMotion === true;
  // 위치(아래로 내려간 거리)는 네이티브 드라이버로, 높이는 레이아웃 속성이라 JS 로 움직인다.
  const translateY = useRef(new Animated.Value(windowHeight)).current;
  const sheetHeight = useRef(new Animated.Value(0)).current;
  // 백드롭 농도의 기준 — 시트가 자기 높이만큼 내려가면(화면 밖) 0 이 된다.
  const backdropRange = useRef(new Animated.Value(windowHeight)).current;
  const measuredHeightRef = useRef<number | null>(null);
  const entranceRef = useRef<EntranceState>("waiting");
  // 올라오기 전 탭(호스트 공유 시트 위로 뜨는 동안)이 보이지도 않는 시트를 닫지 않게 백드롭을 잠가 둔다.
  const [hasEntranceStarted, setHasEntranceStarted] = useState(false);
  const isDraggingRef = useRef(false);
  const isClosingRef = useRef(false);
  const hasClosedRef = useRef(false);
  const [isClosing, setIsClosing] = useState(false);
  const entranceTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(
    () => () => {
      clearTimeout(entranceTimerRef.current);
      clearTimeout(closeTimerRef.current);
    },
    [],
  );

  const settle = useCallback(
    (velocity = 0, onSettled?: () => void) => {
      if (isReduceMotionEnabled) {
        translateY.setValue(0);
        onSettled?.();
        return;
      }
      Animated.spring(translateY, {
        toValue: 0,
        velocity,
        ...SHEET_SPRING,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onSettled?.();
      });
    },
    [translateY, isReduceMotionEnabled],
  );

  // 콘텐츠 높이와 동작 줄이기 설정을 둘 다 안 뒤에 한 번만 올라온다.
  const enter = useCallback(() => {
    if (
      entranceRef.current !== "waiting" ||
      isClosingRef.current ||
      measuredHeightRef.current === null ||
      reduceMotion === null
    ) {
      return;
    }
    entranceRef.current = "entering";
    setHasEntranceStarted(true);
    settle(0, () => {
      entranceRef.current = "entered";
    });
  }, [reduceMotion, settle]);

  useEffect(enter, [enter]);

  // 등장이 어떤 이유로든(설정 조회·애니메이션 완료 신호가 오지 않음) 멈추면 제자리에 올려 둔다.
  const ensureEntered = useCallback(() => {
    if (
      entranceRef.current === "entered" ||
      isClosingRef.current ||
      isDraggingRef.current
    ) {
      return;
    }
    translateY.stopAnimation();
    translateY.setValue(0);
    entranceRef.current = "entered";
    setHasEntranceStarted(true);
  }, [translateY]);

  const finishClose = useCallback(() => {
    clearTimeout(closeTimerRef.current);
    if (hasClosedRef.current) return;
    hasClosedRef.current = true;
    onClose();
  }, [onClose]);

  // 인앱 시트(gorhom)처럼 닫힐 때도 같은 스프링으로 내려간다.
  const slideOut = useCallback(
    (velocity: number) => {
      if (isReduceMotionEnabled) {
        finishClose();
        return;
      }
      Animated.spring(translateY, {
        toValue: measuredHeightRef.current ?? windowHeight,
        velocity,
        ...SHEET_SPRING,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          finishClose();
          return;
        }
        // 끊긴 채 닫는 중으로 남으면 시트를 다시 닫을 수 없다.
        clearTimeout(closeTimerRef.current);
        isClosingRef.current = false;
        setIsClosing(false);
      });
    },
    [translateY, windowHeight, finishClose, isReduceMotionEnabled],
  );

  const closeSheet = useCallback(
    (velocity: number) => {
      if (isClosingRef.current) return;
      isClosingRef.current = true;
      setIsClosing(true);
      // 기다림이나 퇴장 애니메이션이 끝나지 않아도 조작이 막힌 채 남지 않게 시한 뒤엔 닫는다.
      closeTimerRef.current = setTimeout(finishClose, CLOSE_DEADLINE_MS);
      if (waitBeforeClose) {
        waitBeforeClose(() => slideOut(velocity));
      } else {
        slideOut(velocity);
      }
    },
    [waitBeforeClose, slideOut, finishClose],
  );

  // onPress 가 넘기는 이벤트가 속도로 새지 않게 감싼다.
  const dismiss = useCallback(() => closeSheet(0), [closeSheet]);

  // 콘텐츠가 바뀌면(확인 → 저장 → 결과, 리마인드 펼침) 잰 높이로 시트 높이를 따라 움직인다.
  // 처음 잰 뒤에 올라와야 빈 시트가 비치지 않는다.
  const handleContentLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { height } = event.nativeEvent.layout;
      const previousHeight = measuredHeightRef.current;
      if (height === previousHeight) return;
      measuredHeightRef.current = height;
      backdropRange.setValue(height);
      if (entranceRef.current === "waiting") {
        // 올라오기 전엔 늘 최신 높이만큼 내려 둔다 — 예전 높이만큼이면 커진 만큼 윗부분이 비친다.
        sheetHeight.setValue(height);
        if (isClosingRef.current) return;
        translateY.setValue(height);
        if (previousHeight === null) {
          entranceTimerRef.current = setTimeout(
            ensureEntered,
            ENTRANCE_DEADLINE_MS,
          );
        }
        enter();
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
    [
      backdropRange,
      sheetHeight,
      translateY,
      enter,
      ensureEntered,
      isReduceMotionEnabled,
    ],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          !isLocked && !isClosingRef.current && gesture.dy > 4,
        // 등장·복귀 애니메이션 도중에 잡아도 그 자리에서 이어 끈다 — 위치는 네이티브가 들고 있어
        // 오프셋으로 넘겨받는다.
        onPanResponderGrant: () => {
          isDraggingRef.current = true;
          // 올라오던 중에 잡으면 그 자리에서 끄는 것이 곧 등장을 마친 것이다.
          if (entranceRef.current === "entering") {
            entranceRef.current = "entered";
          }
          translateY.stopAnimation();
          translateY.extractOffset();
        },
        onPanResponderMove: (_, gesture) => {
          translateY.setValue(gesture.dy);
        },
        onPanResponderRelease: (_, gesture) => {
          isDraggingRef.current = false;
          translateY.flattenOffset();
          const velocity = gesture.vy * RELEASE_VELOCITY_SCALE;
          if (shouldDismissByDrag(gesture.dy, gesture.vy)) {
            closeSheet(velocity);
          } else {
            settle(velocity);
          }
        },
        onPanResponderTerminate: () => {
          isDraggingRef.current = false;
          translateY.flattenOffset();
          settle();
        },
      }),
    [isLocked, translateY, closeSheet, settle],
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
      <ShareSheetPanContext.Provider value={panResponder.panHandlers}>
        <View
          pointerEvents={isClosing ? "none" : "auto"}
          className="flex-1 justify-end"
        >
          <Animated.View
            style={[StyleSheet.absoluteFill, { opacity: backdropOpacity }]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="시트 닫기"
              disabled={isLocked || !hasEntranceStarted}
              onPress={dismiss}
              className="flex-1 bg-opacity-black-100"
            />
          </Animated.View>
          <Animated.View
            style={{ transform: [{ translateY: sheetTranslateY }] }}
          >
            <Animated.View testID="share-sheet" style={{ height: sheetHeight }}>
              <SheetSurface style={{ flex: 1 }}>
                {/* 시트 높이에 눌리지 않은 제 높이를 재려고 띄워 둔다(넘치면 상단 Safe Area 까지). */}
                <View
                  onLayout={handleContentLayout}
                  className="absolute inset-x-0 top-0"
                  style={{ maxHeight: windowHeight - insets.top }}
                >
                  <View
                    testID="share-sheet-handle"
                    {...panResponder.panHandlers}
                  >
                    <SheetHandle />
                  </View>
                  {children}
                </View>
              </SheetSurface>
            </Animated.View>
          </Animated.View>
        </View>
      </ShareSheetPanContext.Provider>
    </ShareSheetDismissContext.Provider>
  );
}
