import { FOLDER_TONE_HEX } from "@shared/folder/folder.constants";
import type { FolderColor } from "@shared/types/link.types";

import { FolderIcon } from "@/components/ui/icon/FolderIcon";
import { ListRow } from "@/components/ui/list-row/ListRow";
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

export interface FolderItemProps {
  name: string;
  /** 링크 수. 아직 모르면(로딩 중) 생략하고, 그 자리엔 스켈레톤을 보여준다. */
  count?: number;
  tone?: FolderColor;
  onPress?: () => void;
}

// 공용 ListRow 위에 폴더 전용 슬롯(아이콘 leading · 링크 수 trailing)만 얹은 얇은 래퍼.
export function FolderItem({
  name,
  count,
  tone = "gray",
  onPress,
}: FolderItemProps) {
  return (
    <ListRow
      label={name}
      onPress={onPress}
      chevron
      leading={<FolderIcon color={folderToneFill(tone)} size={28} />}
      trailing={
        count === undefined ? (
          <Skeleton testID="folder-count-skeleton" className="h-4 w-6" />
        ) : (
          <Text variant="body-2-normal" className="text-text-alternative">
            {count}
          </Text>
        )
      }
    />
  );
}
