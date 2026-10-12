import GorhomBottomSheet, {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  type BottomSheetBackgroundProps,
  useBottomSheetSpringConfigs,
} from "@gorhom/bottom-sheet";
import { SheetHandle, SheetSurface } from "@promise9/ui/sheet/SheetChrome";
import {
  SHEET_BACKDROP_OPACITY,
  SHEET_SPRING,
} from "@promise9/ui/sheet/sheet.constants";
import type { ReactNode } from "react";
import { useCallback, useRef } from "react";
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

function SolidBackground({ style }: BottomSheetBackgroundProps) {
  return <SheetSurface style={style} />;
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

  const animationConfigs = useBottomSheetSpringConfigs(SHEET_SPRING);

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
        opacity={SHEET_BACKDROP_OPACITY}
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
      // edge-to-edge 창은 adjustResize 로도 줄어들지 않아 gorhom 이 리사이즈를 기다리면 입력이
      // 키보드에 가려진다 — adjustPan 으로 두면 키보드 높이만큼 시트를 직접 올린다.
      android_keyboardInputMode="adjustPan"
      onChange={handleChange}
      onClose={notifyClose}
      animationConfigs={animationConfigs}
      backdropComponent={renderBackdrop}
      backgroundComponent={SolidBackground}
      handleComponent={SheetHandle}
    >
      {children}
    </GorhomBottomSheet>
  );
}
