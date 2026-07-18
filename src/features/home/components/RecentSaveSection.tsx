import type { Link } from "@shared/types/link.types";
import { chunk } from "es-toolkit";
import { ChevronRight } from "lucide-react-native";
import { ScrollView } from "react-native";

import { HStack } from "@/components/ui/hstack/HStack";
import { Icon } from "@/components/ui/icon/Icon";
import { LinkListItem } from "@/components/ui/link-card/LinkListItem";
import { Text } from "@/components/ui/text/Text";
import { VStack } from "@/components/ui/vstack/VStack";

/** 한 페이지에 세로로 쌓는 카드 수 (Figma 스펙) */
const PAGE_SIZE = 3;

interface RecentSaveSectionProps {
  links: Link[];
}

/** 최근 저장 섹션 — 페이지당 3개씩 세로로 쌓아 가로로 넘기는 캐러셀. */
export function RecentSaveSection({ links }: RecentSaveSectionProps) {
  const pages = chunk(links, PAGE_SIZE);

  return (
    <VStack className="gap-4">
      <HStack className="items-center gap-1 px-5">
        <Text variant="heading-1" className="text-text-strong">
          최근 저장
        </Text>
        <Icon iconNode={ChevronRight} size={20} className="text-text-strong" />
      </HStack>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <HStack className="gap-3 px-5">
          {pages.map((page) => (
            <VStack key={page[0].linkId} className="gap-2">
              {page.map((link) => (
                <LinkListItem key={link.linkId} link={link} />
              ))}
            </VStack>
          ))}
        </HStack>
      </ScrollView>
    </VStack>
  );
}
