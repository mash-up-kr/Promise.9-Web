import type { Link } from "@shared/types/link.types";
import { useRouter } from "expo-router";
import { View } from "react-native";

import { LinkTile } from "@/components/ui/link-card/LinkTile";
import { useLinkGridLayout } from "@/components/ui/link-card/useLinkGridLayout";
import { linkDetailHref } from "@/constants/routes.constants";

export interface LinkGridProps {
  links: Link[];
}

/** 링크 타일 그리드 — 검색 결과·카테고리 둘러보기가 공유한다. 열 수·카드 폭은 그리드 폭에 맞춘다. */
export function LinkGrid({ links }: LinkGridProps) {
  const router = useRouter();
  const { tileWidth, onLayout } = useLinkGridLayout();

  return (
    <View
      testID="link-grid"
      onLayout={onLayout}
      className="flex-row flex-wrap gap-x-[15px] gap-y-5"
    >
      {links.map((link) => (
        <LinkTile
          key={link.linkId}
          link={link}
          width={tileWidth}
          // 시안 Content Card 는 메타 라인을 끈 인스턴스를 쓴다(홈과 동일).
          showMeta={false}
          onPress={() => router.push(linkDetailHref(String(link.linkId)))}
        />
      ))}
    </View>
  );
}
