import type { Link } from "@shared/types/link.types";
import { Check } from "lucide-react-native";
import type { PressableProps } from "react-native";

import { Box } from "@/components/ui/box/Box";
import { Icon } from "@/components/ui/icon/Icon";
import { VStack } from "@/components/ui/vstack/VStack";

import { LinkCard } from "./LinkCard";

interface LinkTileProps extends Omit<PressableProps, "children"> {
  link: Link;
  /** 다중 선택 모드의 선택 상태 — 썸네일에 yellow 보더·딤·체크 뱃지를 얹는다(Figma Content Card/Selected). */
  isSelected?: boolean;
}

// 선택 상태 오버레이 — 딤 + 체크 뱃지(Figma Content Card/Selected).
function SelectedOverlay() {
  return (
    <>
      <Box className="absolute inset-0 bg-opacity-black-20" />
      <Box
        testID="link-tile-selected-badge"
        className="absolute top-2.5 left-2.5 size-5 items-center justify-center rounded-xl bg-yellow-300"
      >
        <Icon
          iconNode={Check}
          size={12}
          strokeWidth={2}
          className="text-icon-inverse"
        />
      </Box>
    </>
  );
}

/** 세로형 링크 카드 — 그리드·캐러셀용. 큰 썸네일(160×200) 위에 메타·제목을 쌓는다. */
export function LinkTile({
  link,
  isSelected = false,
  ...props
}: LinkTileProps) {
  return (
    <LinkCard.Root link={link} className="w-40 gap-2" {...props}>
      <Box
        className={
          isSelected
            ? "overflow-hidden rounded-[20px] border-2 border-yellow-300"
            : undefined
        }
      >
        <LinkCard.Thumbnail className="h-[200px] w-40 rounded-[20px]" />
        {isSelected && <SelectedOverlay />}
      </Box>
      <VStack className="gap-0.5">
        <LinkCard.Meta />
        <LinkCard.Title variant="body-3" />
      </VStack>
    </LinkCard.Root>
  );
}
