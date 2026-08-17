import type { Link } from "@shared/types/link.types";
import { FolderInput, Share, Trash2, Undo2 } from "lucide-react-native";
import { useRef } from "react";
import { Pressable, View } from "react-native";
import { Icon, type IconComponent } from "@/components/ui/icon/Icon";
import { LinkTile } from "@/components/ui/link-card/LinkTile";
import { Popover } from "@/components/ui/popover/Popover";
import { Text } from "@/components/ui/text/Text";

// Figma "More Menu"(node 46:5817): 폭 170. 위치는 누른 카드(20,126) 기준 (87,155) 이므로
// 카드 좌상단에서 오른쪽 67 · 아래 29 만큼 떨어뜨린다 — 카드 아래에 붙이면 카드(높이 244)를
// 지나 다음 줄까지 내려가 누른 대상에서 멀어진다.
const MENU_WIDTH = 170;
const MENU_OFFSET = { left: 67, top: 29 };

interface LinkContextMenuBaseProps {
  link: Link;
  onOpenLink: () => void;
}

interface DefaultMenuProps extends LinkContextMenuBaseProps {
  variant?: "default";
  onMove: () => void;
  onShare: () => void;
  onDelete: () => void;
}

interface TrashMenuProps extends LinkContextMenuBaseProps {
  variant: "trash";
  onRestore: () => void;
}

// 폴더 종류에 따라 고를 수 있는 동작 자체가 달라서 핸들러도 함께 갈린다.
export type LinkContextMenuProps = DefaultMenuProps | TrashMenuProps;

/**
 * 링크 카드 + 롱프레스 컨텍스트 메뉴.
 *
 * 기본은 폴더 이동 / 링크 공유 / 삭제, 최근 삭제 폴더는 복구하기 하나다(Figma 62:7567).
 */
export function LinkContextMenu(props: LinkContextMenuProps) {
  const { link, onOpenLink } = props;
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
      offsetFromTrigger={MENU_OFFSET}
      closeAccessibilityLabel="링크 메뉴 닫기"
      onClosed={runPendingAction}
      trigger={(open) => (
        <LinkTile link={link} onPress={onOpenLink} onLongPress={open} />
      )}
    >
      {(close) =>
        props.variant === "trash" ? (
          <View className="flex-col gap-4">
            <MenuItem
              icon={Undo2}
              label="복구하기"
              onPress={() => selectAction(close, props.onRestore)}
            />
          </View>
        ) : (
          <View className="flex-col gap-4">
            <MenuItem
              icon={FolderInput}
              label="폴더 이동"
              onPress={() => selectAction(close, props.onMove)}
            />
            <MenuItem
              icon={Share}
              label="링크 공유"
              onPress={() => selectAction(close, props.onShare)}
            />
            <MenuItem
              icon={Trash2}
              label="삭제"
              destructive
              onPress={() => selectAction(close, props.onDelete)}
            />
          </View>
        )
      }
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
