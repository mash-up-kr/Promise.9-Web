import GorhomBottomSheet, {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  type BottomSheetBackgroundProps,
} from "@gorhom/bottom-sheet";
import type { ReactNode } from "react";
import { useCallback, useRef } from "react";
import { View } from "react-native";

import { GlassView } from "@/components/ui/glass-view/GlassView";

export interface BottomSheetProps {
  onClose: () => void;
  children: ReactNode;
  snapPoints?: (string | number)[];
}

function GlassBackground({ style }: BottomSheetBackgroundProps) {
  return (
    <GlassView
      intensity={100}
      style={style}
      className="overflow-hidden rounded-t-[36px]"
    />
  );
}

function Handle() {
  return (
    <View className="items-center py-3">
      <View className="h-1 w-9 rounded-full bg-icon-assistive" />
    </View>
  );
}

export function BottomSheet({
  onClose,
  children,
  snapPoints,
}: BottomSheetProps) {
  const ref = useRef<GorhomBottomSheet>(null);

  const handleChange = useCallback(
    (index: number) => {
      if (index === -1) onClose();
    },
    [onClose],
  );

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    [],
  );

  return (
    <GorhomBottomSheet
      ref={ref}
      index={0}
      snapPoints={snapPoints}
      enableDynamicSizing={!snapPoints}
      enablePanDownToClose
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      onChange={handleChange}
      backdropComponent={renderBackdrop}
      backgroundComponent={GlassBackground}
      handleComponent={Handle}
    >
      {children}
    </GorhomBottomSheet>
  );
}
