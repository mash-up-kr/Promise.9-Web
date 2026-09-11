import type { Link } from "@shared/types/link.types";
import { createContext, useContext } from "react";
import type { PressableProps } from "react-native";
import { Pressable } from "react-native";
import { Box } from "@/components/ui/box/Box";
import { HStack } from "@/components/ui/hstack/HStack";
import { Image } from "@/components/ui/image/Image";
import { Text, type TextProps } from "@/components/ui/text/Text";
import { tv } from "@/lib/tv";
import { formatRelativeDate } from "@/utils/format";

const LinkCardContext = createContext<Link | null>(null);

// 서버가 제목을 아직 만들지 못한 링크(processingStatus PENDING·실패)는 title 이 빈 문자열로 온다 —
// 빈 카드 대신 출처 도메인을 보여준다(저장 시트 프리뷰의 title ?? domain 과 같은 정책).
function getDisplayTitle({ title, source }: Link): string {
  return title.trim().length > 0 ? title : source;
}

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
        accessibilityLabel={getDisplayTitle(link)}
        className={className}
        {...props}
      >
        {children}
      </Pressable>
    </LinkCardContext.Provider>
  );
}

const thumbnailStyles = tv({
  base: "overflow-hidden bg-background-thumbnail",
});

// 썸네일 없음 플레이스홀더 일러스트(투명 240×240) — LinkThumbnail 과 같은 에셋 재사용.
const PLACEHOLDER_SOURCE = require("@/assets/images/no-thumbnail.png");

interface ThumbnailProps {
  className?: string;
  /** 폭에 따라 계산된 크기 — 고정 크기는 className 으로 준다. */
  size?: { width: number; height: number };
}

/** 링크 썸네일. URL 이 없으면 placeholder 를 렌더한다. 크기·모서리는 className 으로 지정한다. */
function Thumbnail({ className, size }: ThumbnailProps) {
  const { thumbnailUrl } = useLinkCard();

  if (!thumbnailUrl) {
    return (
      <Box
        testID="link-card-thumbnail-placeholder"
        className={thumbnailStyles({
          class: ["items-center justify-center", className],
        })}
        style={size}
      >
        {/* Figma Image Placeholder: 구름 일러스트를 박스 폭 75% 정사각으로 중앙 배치. */}
        <Image
          testID="link-card-thumbnail-placeholder-image"
          source={PLACEHOLDER_SOURCE}
          contentFit="contain"
          className="aspect-square w-3/4"
        />
      </Box>
    );
  }
  // 크기·모서리는 래퍼가 갖고 이미지는 채우기만 한다 — expo-image 는 웹에서 style 을 평탄화해
  // className 과 숫자 style 이 한 객체로 섞이면 react-native-web(styleq)이 거부한다.
  return (
    <Box className={thumbnailStyles({ class: className })} style={size}>
      <Image
        testID="link-card-thumbnail-image"
        source={{ uri: thumbnailUrl }}
        contentFit="cover"
        className="size-full"
      />
    </Box>
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

/** 링크 제목. 시안 최대치(max-height = 3줄)대로 3줄 말줄임으로 렌더한다. */
function Title({ variant = "body-3", className }: TitleProps) {
  const link = useLinkCard();

  return (
    <Text variant={variant} numberOfLines={3} className={className}>
      {getDisplayTitle(link)}
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
