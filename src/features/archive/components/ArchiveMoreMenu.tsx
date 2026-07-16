import { ArrowUpDown, Ellipsis, Plus } from "lucide-react-native";
import { useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon, type IconComponent } from "@/components/ui/icon/Icon";
import { IconButton } from "@/components/ui/icon-button/IconButton";
import { Text } from "@/components/ui/text/Text";

// 헤더 아래(우측)에 드롭다운을 띄우기 위한 대략적 헤더 높이.
const MENU_TOP_OFFSET = 52;

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
          <View
            style={{ top: insets.top + MENU_TOP_OFFSET }}
            className="absolute right-5 min-w-[200px] overflow-hidden rounded-2xl bg-background-thumbnail py-1"
          >
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
      className="flex-row items-center gap-3 px-4 py-3"
    >
      <Icon iconNode={icon} size={20} className="text-icon-normal" />
      <Text variant="body-2-normal" className="text-text-normal">
        {label}
      </Text>
    </Pressable>
  );
}
