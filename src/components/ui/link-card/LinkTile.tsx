import type { Link } from "@shared/types/link.types";
import type { PressableProps } from "react-native";

import { VStack } from "@/components/ui/vstack/VStack";

import { LinkCard } from "./LinkCard";

interface LinkTileProps extends Omit<PressableProps, "children"> {
  link: Link;
}

/** 세로형 링크 카드 — 그리드·캐러셀용. 큰 썸네일(160×200) 위에 메타·제목을 쌓는다. */
export function LinkTile({ link, ...props }: LinkTileProps) {
  return (
    <LinkCard.Root link={link} className="w-40 gap-2" {...props}>
      <LinkCard.Thumbnail className="h-[200px] w-40 rounded-[20px]" />
      <VStack className="gap-0.5">
        <LinkCard.Meta />
        <LinkCard.Title variant="body-3" />
      </VStack>
    </LinkCard.Root>
  );
}
