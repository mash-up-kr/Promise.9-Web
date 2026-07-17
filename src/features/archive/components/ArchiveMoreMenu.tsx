import { ArrowUpDown, Ellipsis, Plus } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { Icon, type IconComponent } from "@/components/ui/icon/Icon";
import { IconButton } from "@/components/ui/icon-button/IconButton";
import { Popover } from "@/components/ui/popover/Popover";
import { Text } from "@/components/ui/text/Text";

// Figma: safe-area 상단 +7px, 화면 우측 9px 여백, 너비 220px (node 13:5000).
const MENU_ANCHOR = { top: 7, right: 9 };
const MENU_WIDTH = 220;

export interface ArchiveMoreMenuProps {
  onCreateFolder: () => void;
  onEditOrder: () => void;
}

// 보관함 헤더 "더보기" 드롭다운 — 새 폴더 만들기 / 폴더 정렬 편집.
export function ArchiveMoreMenu({
  onCreateFolder,
  onEditOrder,
}: ArchiveMoreMenuProps) {
  return (
    <Popover
      width={MENU_WIDTH}
      anchor={MENU_ANCHOR}
      trigger={(open) => (
        <IconButton
          iconNode={Ellipsis}
          accessibilityLabel="더보기"
          onPress={open}
        />
      )}
    >
      {(close) => (
        <View className="flex-col gap-4">
          <MenuItem
            icon={Plus}
            label="새 폴더 만들기"
            onPress={() => {
              close();
              onCreateFolder();
            }}
          />
          <MenuItem
            icon={ArrowUpDown}
            label="폴더 정렬 편집"
            onPress={() => {
              close();
              onEditOrder();
            }}
          />
        </View>
      )}
    </Popover>
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
      className="w-full flex-row items-center gap-4 px-6"
    >
      <Icon iconNode={icon} size={20} className="text-icon-normal" />
      <Text variant="body-1" className="text-text-strong">
        {label}
      </Text>
    </Pressable>
  );
}
