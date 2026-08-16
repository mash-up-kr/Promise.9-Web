import {
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronUp,
  CopyCheck,
  Ellipsis,
} from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { Icon, type IconComponent } from "@/components/ui/icon/Icon";
import { IconButton } from "@/components/ui/icon-button/IconButton";
import { Popover } from "@/components/ui/popover/Popover";
import { Text } from "@/components/ui/text/Text";

import { LINK_SORT_OPTIONS } from "../archive.constants";
import type { LinkSortOption } from "../archive.types";

// Figma "More Menu"(node 46:5948): 폭 170, 화면 우측에서 20px. 세로는 Popover 가 트리거 아래로 붙인다.
const MENU_WIDTH = 170;
const MENU_ANCHOR = { right: 20 };

export interface ArchiveDetailMoreMenuProps {
  sort: LinkSortOption;
  onSortChange: (sort: LinkSortOption) => void;
  onSelectMode: () => void;
}

/** 폴더 상세 헤더 "더보기" 드롭다운 — 선택하기 / 정렬(최신순·오래된 순). */
export function ArchiveDetailMoreMenu({
  sort,
  onSortChange,
  onSelectMode,
}: ArchiveDetailMoreMenuProps) {
  // 정렬 서브메뉴 펼침 여부. 메뉴를 닫으면 접어 다음에 열 때 처음 상태로 시작한다.
  const [isSortExpanded, setIsSortExpanded] = useState(false);

  return (
    <Popover
      width={MENU_WIDTH}
      anchor={MENU_ANCHOR}
      trigger={(open) => (
        <IconButton
          iconNode={Ellipsis}
          accessibilityLabel="더보기"
          // 닫을 때가 아니라 열 때 접는다 — 닫힘 통지(onClosed)는 iOS 에서 Modal 이
          // 사라진 뒤에야 오므로, 여기서 맞춰야 어느 플랫폼에서든 처음 상태로 열린다.
          onPress={() => {
            setIsSortExpanded(false);
            open();
          }}
        />
      )}
    >
      {(close) => (
        <View className="flex-col gap-4">
          <MenuItem
            icon={CopyCheck}
            label="선택하기"
            onPress={() => {
              close();
              onSelectMode();
            }}
          />
          <MenuItem
            icon={ArrowUpDown}
            label="정렬"
            isHighlighted={isSortExpanded}
            trailing={
              <Icon
                iconNode={isSortExpanded ? ChevronUp : ChevronDown}
                size={20}
                className="text-icon-normal"
              />
            }
            onPress={() => setIsSortExpanded((expanded) => !expanded)}
          />
          {isSortExpanded &&
            LINK_SORT_OPTIONS.map((option) => (
              <SortItem
                key={option.value}
                label={option.label}
                isSelected={option.value === sort}
                onPress={() => {
                  close();
                  onSortChange(option.value);
                }}
              />
            ))}
        </View>
      )}
    </Popover>
  );
}

interface MenuItemProps {
  icon: IconComponent;
  label: string;
  /** 정렬 서브메뉴가 펼쳐진 동안 부모 행을 눌린 것처럼 유지한다(Figma gray-600). */
  isHighlighted?: boolean;
  trailing?: React.ReactNode;
  onPress: () => void;
}

function MenuItem({
  icon,
  label,
  isHighlighted = false,
  trailing,
  onPress,
}: MenuItemProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className={`w-full flex-row items-center gap-3 px-5 ${
        isHighlighted ? "py-1" : ""
      }`}
    >
      <Icon iconNode={icon} size={20} className="text-icon-normal" />
      <Text variant="body-2-normal" className="flex-1 text-text-strong">
        {label}
      </Text>
      {trailing}
    </Pressable>
  );
}

interface SortItemProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}

// 정렬 기준 행 — 아이콘 자리는 선택 여부와 무관하게 비워둬야 라벨이 흔들리지 않는다.
function SortItem({ label, isSelected, onPress }: SortItemProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: isSelected }}
      onPress={onPress}
      className="w-full flex-row items-center gap-3 px-5"
    >
      <View className="size-5 items-center justify-center">
        {isSelected && (
          <Icon iconNode={Check} size={20} className="text-icon-normal" />
        )}
      </View>
      <Text variant="body-2-normal" className="text-text-strong">
        {label}
      </Text>
    </Pressable>
  );
}
