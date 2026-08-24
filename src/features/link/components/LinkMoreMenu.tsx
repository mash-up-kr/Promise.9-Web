import { Ellipsis, FolderInput, Share, Trash2 } from "lucide-react-native";
import { useRef } from "react";
import { View } from "react-native";

import { IconButton } from "@/components/ui/icon-button/IconButton";
import { Popover } from "@/components/ui/popover/Popover";
import { PopoverMenuItem } from "@/components/ui/popover/PopoverMenuItem";

// ArchiveMoreMenu 와 동일한 우측 앵커. 폭은 Figma more-menu 기준(대조 조정 가능).
const MENU_WIDTH = 200;
const MENU_ANCHOR = { right: 12 } as const;

export interface LinkMoreMenuProps {
  onMove: () => void;
  onShare: () => void;
  onDelete: () => void;
}

export function LinkMoreMenu({ onMove, onShare, onDelete }: LinkMoreMenuProps) {
  // 이동 시트·삭제 다이얼로그는 또 다른 Modal 이라 팝오버가 닫히는 도중 띄우면 iOS 에서 안 뜬다.
  // 고른 동작을 담아뒀다가 팝오버가 완전히 닫힌 뒤 실행한다(LinkContextMenu 와 동일).
  const pendingRef = useRef<(() => void) | null>(null);

  const selectAction = (close: () => void, action: () => void) => {
    pendingRef.current = action;
    close();
  };
  const runPending = () => {
    const action = pendingRef.current;
    pendingRef.current = null;
    action?.();
  };

  return (
    <Popover
      width={MENU_WIDTH}
      anchor={MENU_ANCHOR}
      onClosed={runPending}
      closeAccessibilityLabel="더보기 메뉴 닫기"
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
          <PopoverMenuItem
            icon={FolderInput}
            label="폴더 이동"
            onPress={() => selectAction(close, onMove)}
          />
          <PopoverMenuItem
            icon={Share}
            label="링크 공유"
            onPress={() => selectAction(close, onShare)}
          />
          <PopoverMenuItem
            icon={Trash2}
            label="삭제"
            isDestructive
            onPress={() => selectAction(close, onDelete)}
          />
        </View>
      )}
    </Popover>
  );
}
