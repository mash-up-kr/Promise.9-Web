import type { FolderColor, LinkFolderRef } from "@shared/types/link.types";
import { Pressable, View } from "react-native";
import { ChevronIcon } from "@/components/ui/icon/ChevronIcon";
import { FolderIcon } from "@/components/ui/icon/FolderIcon";
import { Text } from "@/components/ui/text/Text";
import { tv } from "@/lib/tv";

const badgeStyles = tv({
  base: "flex-row items-center gap-1.5 rounded-lg px-2 py-1",
});

// 미분류 folder 아이콘 색 = folder/gray(#65656b), Figma 기준. 아이콘은 hex color prop 만 받아 리터럴로 둔다.
const UNCLASSIFIED_ICON_COLOR = "#65656B";
// "폴더선택" chevron accent 색 = icon-accent(#0093ff).
const ACCENT_ICON_COLOR = "#0093FF";

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
  /** "폴더선택"(미분류) 탭 시 폴더 선택 진입. 실제 플로우는 별도 이슈. */
  onPress?: () => void;
}

export function FolderBadge({
  folder,
  folderColor,
  onPress,
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
          onPress={onPress}
          className="flex-row items-center"
        >
          <Text variant="label-2-semibold" className="text-icon-accent">
            폴더선택
          </Text>
          <ChevronIcon direction="right" color={ACCENT_ICON_COLOR} />
        </Pressable>
      </View>
    );
  }

  // 폴더 지정: 컬러 배지
  const style =
    (folderColor && FOLDER_STYLE[folderColor]) ?? DEFAULT_FOLDER_STYLE;
  return (
    <View className="w-full flex-row items-center">
      <View className={badgeStyles({ class: style.badge })}>
        <FolderIcon color={style.iconColor} />
        <Text variant="label-2-semibold" className={style.label}>
          {folder.folderName}
        </Text>
      </View>
    </View>
  );
}
