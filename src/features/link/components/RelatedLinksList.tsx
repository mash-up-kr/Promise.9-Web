import type { Link } from "@shared/types/link";
import { ScrollView, View } from "react-native";
import { Text } from "@/components/ui/text/Text";

import { RelatedLinkCard } from "./RelatedLinkCard";

export interface RelatedLinksListProps {
  items: Link[];
}

export function RelatedLinksList({ items }: RelatedLinksListProps) {
  return (
    <View className="w-full gap-4">
      <Text variant="heading-2" className="px-5">
        함께 다시 볼 링크
      </Text>
      {items.length === 0 ? (
        <View className="w-full items-center justify-center px-5 py-8">
          <View className="items-center">
            <Text
              variant="body-1"
              className="text-center text-opacity-white-70"
            >
              아직 함께 볼 링크가 없어요
            </Text>
            <Text
              variant="body-1"
              className="text-center text-opacity-white-70"
            >
              링크가 쌓이면 비슷한 링크를
            </Text>
            <Text
              variant="body-1"
              className="text-center text-opacity-white-70"
            >
              모아 보여드릴게요
            </Text>
          </View>
        </View>
      ) : (
        // Figma 상 이 섹션은 좌측만 20px 여백이고 우측은 여백 없이 화면 끝까지 이어진다
        // (Folder Carousel x:20, width:355 → 우측 끝이 화면 우측 끝과 일치). 스크롤 끝까지
        // 가면 마지막 카드가 화면 우측 끝에 딱 붙어야 하므로, 좌측 패딩은 contentContainerClassName
        // 으로 콘텐츠에만 주고 ScrollView 자체는 우측 여백 없이 전체 폭을 쓴다.
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-3 pl-5"
        >
          {items.map((item) => (
            <RelatedLinkCard key={item.id} link={item} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}
