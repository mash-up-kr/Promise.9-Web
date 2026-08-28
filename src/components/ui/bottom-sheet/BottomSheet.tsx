import GorhomBottomSheet, {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  type BottomSheetBackgroundProps,
  useBottomSheetSpringConfigs,
} from "@gorhom/bottom-sheet";
import type { ReactNode } from "react";
import { useCallback, useRef } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface BottomSheetProps {
  onClose: () => void;
  children: ReactNode;
  snapPoints?: (string | number)[];
  /** 백드롭 탭 시 동작. "none" 이면 탭으로 닫히지 않는다. 기본 "close". */
  backdropPressBehavior?: "close" | "none";
  /** true 면 pan-down 제스처로 닫히지 않는다. 기본 false. */
  isLocked?: boolean;
}

// Figma Sheet Container: gray-900 솔리드 + 상단 radius 24 + 위쪽 그림자.
function SolidBackground({ style }: BottomSheetBackgroundProps) {
  return (
    <View
      style={style}
      className="overflow-hidden rounded-t-3xl bg-gray-900 shadow-[0px_-8px_24px_0px_rgba(0,0,0,0.35)]"
    />
  );
}

function Handle() {
  return (
    <View className="items-center pt-2 pb-1">
      <View className="h-1 w-9 rounded-full bg-icon-assistive" />
    </View>
  );
}

export function BottomSheet({
  onClose,
  children,
  snapPoints,
  backdropPressBehavior = "close",
  isLocked = false,
}: BottomSheetProps) {
  const ref = useRef<GorhomBottomSheet>(null);
  // 시안 정책: 시트는 콘텐츠만큼 자라되 상단 Safe Area 바로 아래까지만 덮는다.
  const insets = useSafeAreaInsets();

  // 시안 FolderSheet 주석: enter/exit spring 420/40.
  // overshootClamping: 목표 지점을 지나쳐 되튕기는(통통 튀는) 동작을 제거한다.
  const animationConfigs = useBottomSheetSpringConfigs({
    stiffness: 420,
    damping: 40,
    overshootClamping: true,
  });

  // 제스처 닫힘은 onChange(-1), 명령형 close() 는 gorhom 의 onClose 로 통지된다 —
  // 두 경로가 모두 불릴 수 있어 한 번만 전달한다(중복 시 router.back 이 두 번 pop 됨).
  const hasNotifiedCloseRef = useRef(false);
  const notifyClose = useCallback(() => {
    if (hasNotifiedCloseRef.current) return;
    hasNotifiedCloseRef.current = true;
    onClose();
  }, [onClose]);

  const handleChange = useCallback(
    (index: number) => {
      if (index === -1) notifyClose();
    },
    [notifyClose],
  );

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior={backdropPressBehavior}
        opacity={0.6}
      />
    ),
    [backdropPressBehavior],
  );

  return (
    <GorhomBottomSheet
      ref={ref}
      index={0}
      snapPoints={snapPoints}
      enableDynamicSizing={!snapPoints}
      topInset={insets.top}
      enablePanDownToClose={!isLocked}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      onChange={handleChange}
      onClose={notifyClose}
      animationConfigs={animationConfigs}
      backdropComponent={renderBackdrop}
      backgroundComponent={SolidBackground}
      handleComponent={Handle}
    >
      {children}
    </GorhomBottomSheet>
  );
}
