import type { Link } from "@shared/types/link.types";
import { Image } from "expo-image";
import { createContext, useContext } from "react";
import type { PressableProps } from "react-native";
import { Pressable } from "react-native";

import { Box } from "@/components/ui/box/Box";
import { HStack } from "@/components/ui/hstack/HStack";
import { Text, type TextProps } from "@/components/ui/text/Text";
import { tv } from "@/lib/tv";
import { formatRelativeDate } from "@/utils/format";

const LinkCardContext = createContext<Link | null>(null);

function useLinkCard(): Link {
  const link = useContext(LinkCardContext);
  if (!link) {
    throw new Error("LinkCard.* 는 LinkCard.Root 안에서만 사용할 수 있다.");
  }
  return link;
}

interface RootProps extends Omit<PressableProps, "children"> {
  link: Link;
  className?: string;
  children: React.ReactNode;
}

/** 링크 데이터를 하위 요소에 주입하는 카드 컨테이너. 카드 전체가 하나의 버튼으로 동작한다. */
function Root({ link, className, children, ...props }: RootProps) {
  return (
    <LinkCardContext.Provider value={link}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={link.title}
        className={className}
        {...props}
      >
        {children}
      </Pressable>
    </LinkCardContext.Provider>
  );
}

const thumbnailStyles = tv({
  base: "bg-background-thumbnail",
});

interface ThumbnailProps {
  className?: string;
}

/** 링크 썸네일. URL 이 없으면 placeholder 를 렌더한다. 크기·모서리는 className 으로 지정한다. */
function Thumbnail({ className }: ThumbnailProps) {
  const { thumbnailUrl } = useLinkCard();

  if (!thumbnailUrl) {
    return (
      <Box
        testID="link-card-thumbnail-placeholder"
        className={thumbnailStyles({ class: className })}
      />
    );
  }
  return (
    <Image
      testID="link-card-thumbnail-image"
      source={{ uri: thumbnailUrl }}
      contentFit="cover"
      className={thumbnailStyles({ class: className })}
    />
  );
}

/** "대표태그 · 저장시기" 메타 라인. 대표 태그가 없으면 저장 시기만 보여준다. */
function Meta() {
  const { representativeTag, savedAt } = useLinkCard();

  return (
    <HStack className="items-center gap-0.5">
      {representativeTag && (
        <>
          <Text variant="caption-2" className="text-text-neutral">
            {representativeTag.name}
          </Text>
          <Text variant="caption-2" className="text-folder-gray">
            ·
          </Text>
        </>
      )}
      <Text variant="caption-2" className="text-text-neutral">
        {formatRelativeDate(savedAt)}
      </Text>
    </HStack>
  );
}

interface TitleProps {
  variant?: TextProps["variant"];
  className?: string;
}

/** 링크 제목. 2줄 말줄임으로 렌더한다. */
function Title({ variant = "body-3", className }: TitleProps) {
  const { title } = useLinkCard();

  return (
    <Text variant={variant} numberOfLines={2} className={className}>
      {title}
    </Text>
  );
}

/** 링크 카드 조립 키트 — LinkTile·LinkListItem 같은 완성형 카드가 이 요소들을 조합한다. */
export const LinkCard = {
  Root,
  Thumbnail,
  Meta,
  Title,
};
