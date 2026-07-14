import type { Link } from "@shared/types/link.type";
import type { PressableProps } from "react-native";

import { Box } from "@/components/ui/box/Box";
import { HStack } from "@/components/ui/hstack/HStack";
import { VStack } from "@/components/ui/vstack/VStack";

import { LinkCard } from "./LinkCard";

interface LinkListItemProps extends Omit<PressableProps, "children"> {
  link: Link;
}

/** 가로형 링크 행 — 목록용. 작은 썸네일(96×96) 옆에 메타·제목을 두고 아래에 구분선을 그린다. */
export function LinkListItem({ link, ...props }: LinkListItemProps) {
  return (
    <LinkCard.Root link={link} className="gap-2" {...props}>
      <HStack className="items-center gap-3">
        <LinkCard.Thumbnail className="size-24 rounded-2xl" />
        <VStack className="w-48 justify-center gap-1">
          <LinkCard.Meta />
          <LinkCard.Title variant="body-2" />
        </VStack>
      </HStack>
      <Box className="ml-[108px] h-px w-[200px] rounded-xl bg-border-divider" />
    </LinkCard.Root>
  );
}
