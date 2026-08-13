import { Pencil, Trash2 } from "lucide-react-native";
import { Pressable, View } from "react-native";

import { Icon, type IconComponent } from "@/components/ui/icon/Icon";
import { Popover } from "@/components/ui/popover/Popover";
import { Text } from "@/components/ui/text/Text";

import type { ArchiveFolder } from "../archive.types";
import { FolderItem } from "./FolderItem";

// Figma "More Menu" (node 46:5976): 170 폭, 화면 좌측에서 74px.
// 세로 위치(누른 행 아래, 공간 부족 시 위)는 Popover 가 트리거를 재서 잡는다.
const MENU_ANCHOR = { left: 74 };
const MENU_WIDTH = 170;

export interface FolderContextMenuProps {
  folder: ArchiveFolder;
  onOpenFolder: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/** 내 폴더 행 + 롱프레스 컨텍스트 메뉴(폴더 편집 / 삭제). */
export function FolderContextMenu({
  folder,
  onOpenFolder,
  onEdit,
  onDelete,
}: FolderContextMenuProps) {
  return (
    <Popover
      width={MENU_WIDTH}
      anchor={MENU_ANCHOR}
      closeAccessibilityLabel="폴더 메뉴 닫기"
      trigger={(open) => (
        <FolderItem
          name={folder.name}
          count={folder.count}
          tone={folder.tone}
          onPress={onOpenFolder}
          onLongPress={open}
        />
      )}
    >
      {(close) => (
        <View className="flex-col gap-4">
          <MenuItem
            icon={Pencil}
            label="폴더 편집"
            onPress={() => {
              close();
              onEdit();
            }}
          />
          <MenuItem
            icon={Trash2}
            label="삭제"
            destructive
            onPress={() => {
              close();
              onDelete();
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
  destructive?: boolean;
  onPress: () => void;
}

function MenuItem({ icon, label, destructive, onPress }: MenuItemProps) {
  const tone = destructive ? "text-[#ec5656]" : "text-icon-normal";
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="w-full flex-row items-center gap-3 px-5"
    >
      <Icon iconNode={icon} size={20} className={tone} />
      <Text
        variant="body-2-normal"
        className={destructive ? "text-[#ec5656]" : "text-text-strong"}
      >
        {label}
      </Text>
    </Pressable>
  );
}
