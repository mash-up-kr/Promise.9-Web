import { FOLDER_TONE_HEX } from "@shared/folder/folder.constants";
import type { FolderColor } from "@shared/types/link.types";
import { View } from "react-native";
import { FolderIcon } from "@/components/ui/icon/FolderIcon";
import { tv } from "@/lib/tv";

// 폴더 아이콘 채움색(raw hex). 12색은 shared 팔레트(= tokens.css --color-folder-*-solid)를 그대로 쓰고,
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

// 아이콘 뒤 슬롯 배경 = folder/<tone>/subtle.
// NativeWind 는 동적 클래스(`bg-folder-${tone}-subtle`)를 스캔 못 해 리터럴로 나열한다.
const TONE_SLOT: Record<FolderColor, string> = {
  gray: "bg-folder-gray-subtle",
  blue: "bg-folder-blue-subtle",
  slate: "bg-folder-slate-subtle",
  purple: "bg-folder-purple-subtle",
  "orange-red": "bg-folder-orange-red-subtle",
  green: "bg-folder-green-subtle",
  teal: "bg-folder-teal-subtle",
  pink: "bg-folder-pink-subtle",
  red: "bg-folder-red-subtle",
  lime: "bg-folder-lime-subtle",
  "yellow-green": "bg-folder-yellow-green-subtle",
  yellow: "bg-folder-yellow-subtle",
  orange: "bg-folder-orange-subtle",
};

/** 폴더 tone → 아이콘 슬롯 배경 className. */
export function folderToneSlotClass(tone: FolderColor): string {
  return TONE_SLOT[tone];
}

const slotStyles = tv({
  base: "size-7 items-center justify-center rounded-lg",
});

export interface FolderToneIconProps {
  tone: FolderColor;
}

/**
 * 폴더 목록 행의 폴더 아이콘.
 * 시안은 28px tone 슬롯(subtle 배경, radius 8) 안에 20px 아이콘 프레임(글리프 16x14)이다.
 */
export function FolderToneIcon({ tone }: FolderToneIconProps) {
  return (
    <View className={slotStyles({ class: folderToneSlotClass(tone) })}>
      <FolderIcon color={folderToneFill(tone)} size={20} />
    </View>
  );
}
