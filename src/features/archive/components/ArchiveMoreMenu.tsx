import { BlurView } from "expo-blur";
import { ArrowUpDown, Ellipsis, Plus } from "lucide-react-native";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon, type IconComponent } from "@/components/ui/icon/Icon";
import { IconButton } from "@/components/ui/icon-button/IconButton";
import { Text } from "@/components/ui/text/Text";

// 헤더 우측 더보기 버튼 높이에 맞춰 드롭다운을 띄운다.
// Figma: safe-area(top) 기준 7px 아래 = 상태바 바로 아래.
const MENU_TOP_OFFSET = 7;

export interface ArchiveMoreMenuProps {
  onCreateFolder: () => void;
  onEditOrder: () => void;
}

// 보관함 헤더 "더보기" 드롭다운 — 새 폴더 만들기 / 폴더 정렬 편집.
export function ArchiveMoreMenu({
  onCreateFolder,
  onEditOrder,
}: ArchiveMoreMenuProps) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const select = (action: () => void) => () => {
    close();
    action();
  };

  return (
    <>
      <IconButton
        iconNode={Ellipsis}
        accessibilityLabel="더보기"
        onPress={() => setOpen(true)}
      />
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={close}
      >
        <Pressable
          accessibilityLabel="메뉴 닫기"
          onPress={close}
          className="flex-1"
        >
          {/* 리퀴드 글래스 (Figma 레이어 순서): ①블러 → ②반투명 틴트 → ③메뉴 항목 → ④inset 하이라이트.
              blur 는 expo-blur BlurView 로 처리 — iOS(UIVisualEffectView)·웹(backdrop-filter) 실블러. */}
          <View
            style={{ top: insets.top + MENU_TOP_OFFSET }}
            className="absolute right-[9px] w-[220px] flex-col gap-4 overflow-hidden rounded-[36px] py-5"
          >
            <BlurView
              intensity={30}
              tint="dark"
              pointerEvents="none"
              style={StyleSheet.absoluteFill}
            />
            {/* Figma fill: 블러 위에 얹는 반투명 회색 틴트. */}
            <View
              pointerEvents="none"
              style={StyleSheet.absoluteFill}
              className="bg-[rgba(101,101,107,0.1)]"
            />
            <MenuItem
              icon={Plus}
              label="새 폴더 만들기"
              onPress={select(onCreateFolder)}
            />
            <MenuItem
              icon={ArrowUpDown}
              label="폴더 정렬 편집"
              onPress={select(onEditOrder)}
            />
            {/* Figma inset 하이라이트 — 항목 위 최상단 오버레이. */}
            <View
              pointerEvents="none"
              style={StyleSheet.absoluteFill}
              className="rounded-[36px] shadow-[inset_1px_1px_1px_0_var(--color-opacity-white-10),inset_3px_3px_38px_0_rgba(0,0,0,0.31),inset_0px_0px_2px_0_var(--color-opacity-white-40)]"
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

interface MenuItemProps {
  icon: IconComponent;
  label: string;
  onPress: () => void;
}

function MenuItem({ icon, label, onPress }: MenuItemProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="w-[220px] flex-row items-center gap-4 px-6"
    >
      <Icon iconNode={icon} size={20} className="text-icon-normal" />
      <Text variant="body-1" className="text-text-strong">
        {label}
      </Text>
    </Pressable>
  );
}
