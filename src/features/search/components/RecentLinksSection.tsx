import type { Link } from "@shared/types/link.types";
import { ScrollView } from "react-native";

import { HStack } from "@/components/ui/hstack/HStack";
import { Text } from "@/components/ui/text/Text";
import { VStack } from "@/components/ui/vstack/VStack";

import { RecentLinkCard } from "./RecentLinkCard";

export interface RecentLinksSectionProps {
  links: Link[];
}

/** 최근 본 링크 섹션 — 작은 링크 카드를 가로로 넘기는 캐러셀. 링크가 없으면 렌더하지 않는다. */
export function RecentLinksSection({ links }: RecentLinksSectionProps) {
  if (links.length === 0) {
    return null;
  }

  return (
    <VStack className="gap-4">
      <Text variant="heading-2">최근 본 링크</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <HStack className="gap-3">
          {links.map((link) => (
            <RecentLinkCard key={link.linkId} link={link} />
          ))}
        </HStack>
      </ScrollView>
    </VStack>
  );
}
