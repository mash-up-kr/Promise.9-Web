import { useEffect } from "react";
import { Pressable, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassView } from "@/components/ui/glass-view/GlassView";

const CLOSE_THRESHOLD = 120;

export interface BottomSheetProps {
  onClose: () => void;
  children: React.ReactNode;
}

export function BottomSheet({ onClose, children }: BottomSheetProps) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();

  // translateY: height(화면 밖) → 0(열림).
  const translateY = useSharedValue(height);

  // 마운트 시 1회만 슬라이드업. render 본문에 두면 리렌더마다 애니메이션이 재시작된다.
  useEffect(() => {
    translateY.value = withTiming(0, { duration: 260 });
  }, [translateY]);

  const dragY = useSharedValue(0);

  const close = () => {
    "worklet";
    translateY.value = withTiming(height, { duration: 220 }, (finished) => {
      if (finished) {
        runOnJS(onClose)();
      }
    });
  };

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      dragY.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (e.translationY > CLOSE_THRESHOLD) {
        dragY.value = 0;
        close();
      } else {
        dragY.value = withTiming(0, { duration: 150 });
      }
    });

  // keyboardHeight.value 는 키보드 표시 시 음수 → 시트를 그만큼 위로 올린다.
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value + dragY.value + keyboardHeight.value },
    ],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value + dragY.value, [0, height], [1, 0]),
  }));

  return (
    <View className="flex-1 justify-end">
      <Animated.View
        style={backdropStyle}
        className="absolute inset-0 bg-[rgba(0,0,0,0.5)]"
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="닫기"
          onPress={() => close()}
          className="flex-1"
        />
      </Animated.View>
      <Animated.View
        style={sheetStyle}
        // Figma save-sheet: blur(40) 유리 시트. blur 는 GlassView 레이어, drop shadow·모양은
        // 컨테이너에 둔다. overflow-hidden 으로 blur 를 rounded-top 에 맞춘다.
        className="overflow-hidden rounded-t-[36px] px-5 shadow-[4px_0_20px_0_rgba(0,0,0,0.25)]"
      >
        <GlassView intensity={100} className="absolute inset-0" />
        <GestureDetector gesture={pan}>
          <View className="items-center py-3">
            <View className="h-1 w-9 rounded-full bg-icon-assistive" />
          </View>
        </GestureDetector>
        <View style={{ paddingBottom: insets.bottom + 16 }}>{children}</View>
      </Animated.View>
    </View>
  );
}
