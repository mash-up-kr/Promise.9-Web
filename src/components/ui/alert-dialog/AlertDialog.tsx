import type { PropsWithChildren, ReactNode } from "react";
import { useEffect, useRef } from "react";
import { Animated, Modal, Pressable, StyleSheet, View } from "react-native";

import { ActionButton } from "@/components/ui/action-button/ActionButton";
import { Dialog } from "@/components/ui/dialog/Dialog";
import { Text } from "@/components/ui/text/Text";
import { isWeb } from "@/constants/platform.constants";

import { createAlertDialog } from "./createAlertDialog";

// 오버레이 호스트 = RN Modal (gluestack Overlay 의 useRNModal 방식 · Popover 선례와 동일).
// 닫힘 시 언마운트해 잔여 렌더를 남기지 않는다.
// 가운데 정렬은 Dialog 에 맡긴다 — dim 은 아래 Backdrop 이 따로 그리므로 onDismiss 는 넘기지 않는다.
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
      <Dialog>{children}</Dialog>
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
      className="bg-opacity-black-70"
    />
  );
}

const Core = createAlertDialog({ Overlay, Backdrop });

// 시안 DeleteDialog 주석: enter opacity 0 + scale 0.86→1, spring 520/34 mass 0.7.
// (exit 스펙은 Modal 이 닫히며 즉시 언마운트되는 구조라 적용하지 않는다.)
// iOS 공유 익스텐션에서도 쓰여 Reanimated 대신 RN Animated 로 그린다(shareExtension.bundle.test).
const DIALOG_SPRING = { stiffness: 520, damping: 34, mass: 0.7 };

// Figma Alert Dialog: 플랫 gray-800 카드 + white-05 헤어라인 보더.
function AlertDialogContent({ children }: PropsWithChildren) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: 1,
      ...DIALOG_SPRING,
      // react-native-web 은 native driver 가 없어 켜면 경고만 남긴다.
      useNativeDriver: !isWeb,
    }).start();
  }, [progress]);

  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.86, 1],
  });

  return (
    <Animated.View
      accessibilityViewIsModal
      accessibilityRole="alert"
      style={{ opacity: progress, transform: [{ scale }] }}
    >
      <View className="w-[304px] gap-5 overflow-hidden rounded-[36px] border border-opacity-white-05 bg-gray-800 px-4 pt-5 pb-4">
        {children}
      </View>
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

export interface AlertDialogButtonProps {
  label: string;
  variant: "primary" | "secondary" | "destructive";
  onPress: () => void;
  /** 진행 중(로그아웃 등) 중복 탭 방지. */
  disabled?: boolean;
}

// 시안 Action Button Medium 을 그대로 쓰고, 알림 액션이 늘 원하는 반반 배치(flex-1)만 얹는다.
// 스킨의 assistive 를 알림 문맥의 이름(secondary)으로만 바꿔 부른다.
const ACTION_VARIANT = {
  primary: "primary",
  secondary: "assistive",
  destructive: "destructive",
} as const;

export function AlertDialogButton({
  label,
  variant,
  onPress,
  disabled,
}: AlertDialogButtonProps) {
  return (
    <ActionButton
      variant={ACTION_VARIANT[variant]}
      className="flex-1"
      onPress={onPress}
      disabled={disabled}
    >
      {label}
    </ActionButton>
  );
}
