import type { FolderColor, LinkFolderRef } from "@shared/types/link.types";
import { ChevronRight } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { FolderIcon } from "@/components/ui/icon/FolderIcon";
import { Icon } from "@/components/ui/icon/Icon";
import { Text } from "@/components/ui/text/Text";
import { tv } from "@/lib/tv";

const badgeStyles = tv({
  base: "flex-row items-center gap-1.5 rounded-lg px-2 py-1",
});

// 미분류 folder 아이콘 색 = folder/gray(#65656b), Figma 기준. 아이콘은 hex color prop 만 받아 리터럴로 둔다.
const UNCLASSIFIED_ICON_COLOR = "#65656B";

type FolderStyle = { badge: string; label: string; iconColor: string };

// 폴더 지정 배지의 기본 스타일. mock 은 purple 만 사용한다.
const DEFAULT_FOLDER_STYLE: FolderStyle = {
  badge: "bg-folder-purple-subtle",
  label: "text-folder-purple-solid",
  iconColor: "#B282CC",
};

// 폴더 색 → 배지 배경/텍스트 className + 아이콘 hex.
// TODO(backend): 폴더 색상 스펙 확정 시 나머지 variant 를 채운다(지금은 mock 의 purple 만).
const FOLDER_STYLE: Partial<Record<FolderColor, FolderStyle>> = {
  purple: DEFAULT_FOLDER_STYLE,
};

export interface FolderBadgeProps {
  /** 소속 폴더. null 이면 "미분류" fallback 을 그린다. */
  folder: LinkFolderRef | null;
  folderColor?: FolderColor;
  /** 미분류의 "폴더선택" 탭 시 — 폴더 선택 시트 진입. */
  onSelectFolder?: () => void;
  /** 지정 폴더 칩 탭 시 — 해당 폴더 상세로 이동. */
  onOpenFolder?: () => void;
}

export function FolderBadge({
  folder,
  folderColor,
  onSelectFolder,
  onOpenFolder,
}: FolderBadgeProps) {
  // 미분류: 투명 배지("미분류") + 우측 "폴더선택"
  if (folder == null) {
    return (
      <View className="w-full flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5 py-1">
          <FolderIcon color={UNCLASSIFIED_ICON_COLOR} />
          <Text variant="label-2-medium" className="text-icon-alternative">
            미분류
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={onSelectFolder}
          className="flex-row items-center"
        >
          <Text variant="label-2-semibold" className="text-old-icon-accent">
            폴더선택
          </Text>
          <Icon
            iconNode={ChevronRight}
            size={16}
            strokeWidth={1.5}
            className="text-old-icon-accent"
          />
        </Pressable>
      </View>
    );
  }

  // 폴더 지정: 컬러 배지(탭 시 폴더 상세로 이동)
  const style =
    (folderColor && FOLDER_STYLE[folderColor]) ?? DEFAULT_FOLDER_STYLE;
  return (
    <View className="w-full flex-row items-center">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${folder.folderName} 폴더 열기`}
        onPress={onOpenFolder}
        className={badgeStyles({ class: style.badge })}
      >
        <FolderIcon color={style.iconColor} />
        <Text variant="label-2-semibold" className={style.label}>
          {folder.folderName}
        </Text>
      </Pressable>
    </View>
  );
}
