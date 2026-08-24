import { FOLDER_TONE_HEX } from "@shared/folder/folder.constants";
import type { FolderColor } from "@shared/types/link.types";
import { ChevronRight } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { FolderIcon } from "@/components/ui/icon/FolderIcon";
import { Icon } from "@/components/ui/icon/Icon";
import { MoreButton } from "@/components/ui/more-button/MoreButton";
import { Skeleton } from "@/components/ui/skeleton/Skeleton";
import { Text } from "@/components/ui/text/Text";

// 폴더 아이콘 채움색(raw hex). 12색은 shared 팔레트(= global.css --color-folder-*-solid)를 그대로 쓰고,
// gray(시스템 폴더)만 목록 전용 회색을 쓴다.
const GRAY_FILL = "#65656b";
const TONE_FILL: Record<FolderColor, string> = {
  gray: GRAY_FILL,
  ...FOLDER_TONE_HEX,
};

/** 폴더 tone → 아이콘 채움 hex. */
export function folderToneFill(tone: FolderColor): string {
  return TONE_FILL[tone];
}

const FOLDER_ITEM_CLASS =
  "h-[52px] flex-row items-center justify-between bg-background-list px-4 py-3";

export interface FolderItemProps {
  name: string;
  /** 링크 수. 아직 모르면(로딩 중) 생략하고, 그 자리엔 스켈레톤을 보여준다. */
  count?: number;
  tone?: FolderColor;
  onPress?: () => void;
  /** 내 폴더에서 컨텍스트 메뉴(편집·삭제)를 여는 롱프레스. 기본 폴더에는 없다. */
  onLongPress?: () => void;
  /**
   * 컨텍스트 메뉴를 여는 "..." 버튼. 포인터를 올린 동안에만 보이므로 웹에서만 넘긴다
   * (모바일은 롱프레스). 넘기지 않으면 버튼 자리 자체가 없다.
   */
  onMorePress?: () => void;
}

export function FolderItem({
  name,
  count,
  tone = "gray",
  onPress,
  onLongPress,
  onMorePress,
}: FolderItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <View
      className={FOLDER_ITEM_CLASS}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
    >
      {/*
        행 전체를 여는 히트 영역. 내용을 감싸지 않고 "뒤에" 깐다 — 웹에서는 Pressable 안의
        Pressable 이 눌리지 않기 때문이다(바깥 Pressable 이 포인터 이벤트를 가져간다).
        "..." 가 시안대로 개수 앞 인라인에 있어야 해서, 대신 이 히트 영역을 형제로 내렸다.
      */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={name}
        onPress={onPress}
        onLongPress={onLongPress}
        className="absolute inset-0 active:bg-background-list-selected"
      />

      {/* 내용은 포인터를 통과시켜 뒤의 히트 영역이 받게 한다. */}
      <View pointerEvents="none" className="flex-row items-center gap-3">
        <FolderIcon color={folderToneFill(tone)} size={28} />
        <Text variant="body-2-normal" className="text-text-normal">
          {name}
        </Text>
      </View>
      {/* Figma 행 구조: Left · More Button · Right(개수+chevron). "..." 는 hover 때만 낀다. */}
      <View pointerEvents="box-none" className="flex-row items-center gap-2.5">
        {onMorePress && isHovered ? (
          <MoreButton
            accessibilityLabel="폴더 메뉴 열기"
            onPress={onMorePress}
          />
        ) : null}
        <View pointerEvents="none" className="flex-row items-center gap-1">
          {count === undefined ? (
            <Skeleton testID="folder-count-skeleton" className="h-4 w-6" />
          ) : (
            <Text variant="body-2-normal" className="text-text-alternative">
              {count}
            </Text>
          )}
          <Icon
            iconNode={ChevronRight}
            size={16}
            className="text-icon-assistive"
          />
        </View>
      </View>
    </View>
  );
}
