import { BlurView } from "expo-blur";
import type { ReactNode } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";

import { Text } from "@/components/ui/text/Text";
import { tv } from "@/lib/tv";

import { createAlertDialog } from "./createAlertDialog";

// 오버레이 호스트 = RN Modal (gluestack Overlay 의 useRNModal 방식 · Popover 선례와 동일).
// 닫힘 시 언마운트해 잔여 렌더를 남기지 않는다.
function Overlay({
  visible,
  onRequestClose,
  children,
}: {
  visible: boolean;
  onRequestClose: () => void;
  children: ReactNode;
}) {
  if (!visible) return null;
  return (
    <Modal
      visible
      transparent
      statusBarTranslucent
      animationType="fade"
      onRequestClose={onRequestClose}
    >
      <View className="flex-1 items-center justify-center px-6">
        {children}
      </View>
    </Modal>
  );
}

function Backdrop({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="닫기"
      onPress={onPress}
      style={StyleSheet.absoluteFill}
      className="bg-opacity-black-50"
    />
  );
}

const Core = createAlertDialog({ Overlay, Backdrop });

// Figma Alert 카드 = Popover 와 동일한 글래스 레시피
// (①블러 → ②반투명 틴트 → ③내용 → ④inset 하이라이트).
function AlertDialogContent({ children }: { children: ReactNode }) {
  return (
    <Animated.View
      entering={ZoomIn.duration(200)}
      accessibilityViewIsModal
      accessibilityRole="alert"
      className="w-[304px] gap-5 overflow-hidden rounded-[36px] px-4 pt-5 pb-4"
    >
      <BlurView
        intensity={30}
        tint="dark"
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      />
      <View
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
        className="bg-[rgba(101,101,107,0.1)]"
      />
      {children}
      <View
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
        className="rounded-[36px] shadow-[inset_1px_1px_1px_0_var(--color-opacity-white-10),inset_3px_3px_38px_0_rgba(0,0,0,0.31),inset_0px_0px_2px_0_var(--color-opacity-white-40)]"
      />
    </Animated.View>
  );
}

export interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  closeOnOverlayClick?: boolean;
  title: string;
  description?: string;
  // 액션 버튼(들). 2개면 반반, 1개면 꽉 채운다.
  actions: ReactNode;
}

export function AlertDialog({
  isOpen,
  onClose,
  closeOnOverlayClick,
  title,
  description,
  actions,
}: AlertDialogProps) {
  return (
    <Core
      isOpen={isOpen}
      onClose={onClose}
      closeOnOverlayClick={closeOnOverlayClick}
    >
      <Core.Backdrop />
      <AlertDialogContent>
        <View className="w-full items-center gap-1">
          <Text
            variant="heading-3"
            className="w-full text-center tracking-[-0.16px]"
          >
            {title}
          </Text>
          {description ? (
            <Text
              variant="body-2-reading"
              className="w-full text-center text-opacity-white-60"
            >
              {description}
            </Text>
          ) : null}
        </View>
        <View className="w-full flex-row gap-2">{actions}</View>
      </AlertDialogContent>
    </Core>
  );
}

const alertButtonStyles = tv({
  base: "h-11 flex-1 flex-row items-center justify-center rounded-full px-4 py-2.5",
  variants: {
    variant: {
      secondary: "bg-gray-600",
      destructive: "bg-[rgba(168,55,50,0.3)]",
    },
  },
});

const alertButtonLabelStyles = tv({
  base: "font-pretendard-medium text-heading-3 tracking-[-0.16px]",
  variants: {
    variant: {
      secondary: "text-text-normal",
      destructive: "text-[#ec5656]",
    },
  },
});

export interface AlertDialogButtonProps {
  label: string;
  variant: "secondary" | "destructive";
  onPress: () => void;
}

export function AlertDialogButton({
  label,
  variant,
  onPress,
}: AlertDialogButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={alertButtonStyles({ variant })}
    >
      <Text className={alertButtonLabelStyles({ variant })}>{label}</Text>
    </Pressable>
  );
}
