import type { Link } from "@shared/types/link.types";
import { FolderInput, Share, Trash2 } from "lucide-react-native";
import { useRef } from "react";
import { Pressable, View } from "react-native";

import { Icon, type IconComponent } from "@/components/ui/icon/Icon";
import { LinkTile } from "@/components/ui/link-card/LinkTile";
import { Popover } from "@/components/ui/popover/Popover";
import { Text } from "@/components/ui/text/Text";

// Figma "More Menu"(node 46:5817): 폭 170. 가로 위치는 눌린 카드가 있는 열 쪽에 붙인다
// (좌측 열 87 · 우측 열은 같은 값을 오른쪽 기준으로 미러링). 세로는 Popover 가 잡는다.
const MENU_WIDTH = 170;
const START_ANCHOR = { left: 87 };
const END_ANCHOR = { right: 87 };

export interface LinkContextMenuProps {
  link: Link;
  /** 카드가 놓인 열 — 메뉴를 그 열 쪽에 붙인다. 기본 좌측. */
  align?: "start" | "end";
  onOpenLink: () => void;
  onMove: () => void;
  onShare: () => void;
  onDelete: () => void;
}

/** 링크 카드 + 롱프레스 컨텍스트 메뉴(폴더 이동 / 링크 공유 / 삭제). */
export function LinkContextMenu({
  link,
  align = "start",
  onOpenLink,
  onMove,
  onShare,
  onDelete,
}: LinkContextMenuProps) {
  // 이동 시트·삭제 다이얼로그는 또 다른 Modal 이라 메뉴가 사라지는 도중에 띄우면 나타나지 않는다.
  // 고른 동작을 여기 담아뒀다가 팝오버가 완전히 닫힌 뒤에 실행한다.
  const pendingActionRef = useRef<(() => void) | null>(null);

  const selectAction = (close: () => void, action: () => void) => {
    pendingActionRef.current = action;
    close();
  };

  const runPendingAction = () => {
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    action?.();
  };

  return (
    <Popover
      width={MENU_WIDTH}
      anchor={align === "end" ? END_ANCHOR : START_ANCHOR}
      closeAccessibilityLabel="링크 메뉴 닫기"
      onClosed={runPendingAction}
      trigger={(open) => (
        <LinkTile link={link} onPress={onOpenLink} onLongPress={open} />
      )}
    >
      {(close) => (
        <View className="flex-col gap-4">
          <MenuItem
            icon={FolderInput}
            label="폴더 이동"
            onPress={() => selectAction(close, onMove)}
          />
          <MenuItem
            icon={Share}
            label="링크 공유"
            onPress={() => selectAction(close, onShare)}
          />
          <MenuItem
            icon={Trash2}
            label="삭제"
            destructive
            onPress={() => selectAction(close, onDelete)}
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
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="w-full flex-row items-center gap-3 px-5"
    >
      <Icon
        iconNode={icon}
        size={20}
        className={destructive ? "text-action-destructive" : "text-icon-normal"}
      />
      <Text
        variant="body-2-normal"
        className={destructive ? "text-action-destructive" : "text-text-strong"}
      >
        {label}
      </Text>
    </Pressable>
  );
}
