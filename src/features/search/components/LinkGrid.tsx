import type { Link } from "@shared/types/link.types";
import { useRouter } from "expo-router";
import { View } from "react-native";

import { LinkTile } from "@/components/ui/link-card/LinkTile";
import { linkDetailHref } from "@/constants/routes.constants";

export interface LinkGridProps {
  links: Link[];
}

/** 링크 타일 2열 그리드 — 검색 결과·카테고리 둘러보기가 공유한다. */
export function LinkGrid({ links }: LinkGridProps) {
  const router = useRouter();

  return (
    <View className="flex-row flex-wrap gap-x-[15px] gap-y-5">
      {links.map((link) => (
        <LinkTile
          key={link.linkId}
          link={link}
          onPress={() => router.push(linkDetailHref(String(link.linkId)))}
        />
      ))}
    </View>
  );
}
