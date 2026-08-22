import { chunk } from "es-toolkit";
import { useRouter } from "expo-router";
import { Hash } from "lucide-react-native";
import { ScrollView } from "react-native";

import { Chip } from "@/components/ui/chip/Chip";
import { HStack } from "@/components/ui/hstack/HStack";
import { Text } from "@/components/ui/text/Text";
import { VStack } from "@/components/ui/vstack/VStack";
import { searchHref } from "@/constants/routes.constants";

import type { HomeKeyword } from "../home.types";

interface KeywordSectionProps {
  keywords: HomeKeyword[];
}

/** 많이 저장한 키워드 — 2줄로 나눠 가로로 넘겨 보는 칩 목록. */
export function KeywordSection({ keywords }: KeywordSectionProps) {
  const router = useRouter();

  // 키워드가 시안 조건(링크 3개 이상 태그 3종류 이상)을 못 채우면 섹션이 뜨지 않는다.
  if (keywords.length === 0) {
    return null;
  }

  const rows = chunk(keywords, Math.ceil(keywords.length / 2));

  return (
    <VStack className="gap-4">
      <Text variant="heading-1" className="px-5 text-text-strong">
        많이 저장한 키워드
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <VStack className="gap-2 px-5">
          {rows.map((row) => (
            <HStack key={row[0].name} className="gap-1.5">
              {row.map((keyword) => (
                <Chip
                  key={keyword.name}
                  size="md"
                  variant="solid"
                  accessibilityLabel={keyword.name}
                  onPress={() => router.push(searchHref(keyword.name))}
                >
                  <Chip.Icon iconNode={Hash} />
                  <Chip.Text>{keyword.name}</Chip.Text>
                </Chip>
              ))}
            </HStack>
          ))}
        </VStack>
      </ScrollView>
    </VStack>
  );
}
