import { Image } from "expo-image";
import { View } from "react-native";

import { Text } from "@/components/ui/text/Text";

import { resolveEmptyLinksMessage } from "../archive.utils";

// Figma "Empty State"(46:5696): 일러스트 200×200, 콘텐츠 상단에서 155 아래, 텍스트와 16 간격.
const ILLUSTRATION_SIZE = 200;
const TOP_OFFSET = 155;
const illustration = require("../../../../assets/images/empty-links.png");

export interface EmptyLinksProps {
  /** 보관함 라우트 id — 기본 폴더마다 안내 문구가 다르다. */
  folderId: string;
}

/** 폴더에 링크가 하나도 없을 때의 빈 상태. */
export function EmptyLinks({ folderId }: EmptyLinksProps) {
  const { title, description } = resolveEmptyLinksMessage(folderId);

  return (
    <View
      className="flex-1 items-center gap-4 bg-background-base"
      style={{ paddingTop: TOP_OFFSET }}
    >
      <Image
        accessibilityLabel="저장된 링크 없음"
        source={illustration}
        style={{ width: ILLUSTRATION_SIZE, height: ILLUSTRATION_SIZE }}
      />
      <View className="items-center gap-1">
        <Text variant="heading-2" className="text-center text-text-strong">
          {title}
        </Text>
        <Text variant="body-1" className="text-center text-text-neutral">
          {description}
        </Text>
      </View>
    </View>
  );
}
