import type { Link } from "@shared/types/link.types";
import type { PressableProps } from "react-native";

import { LinkCard } from "@/components/ui/link-card/LinkCard";

export interface RecentLinkCardProps extends Omit<PressableProps, "children"> {
  link: Link;
}

/** 최근 본 링크 카드 — Figma Content Card/Small. 작은 썸네일(120×150) 아래 제목. */
export function RecentLinkCard({ link, ...props }: RecentLinkCardProps) {
  return (
    <LinkCard.Root link={link} className="w-30 gap-3" {...props}>
      <LinkCard.Thumbnail className="h-[150px] w-30 rounded-2xl" />
      <LinkCard.Title variant="body-3" />
    </LinkCard.Root>
  );
}
