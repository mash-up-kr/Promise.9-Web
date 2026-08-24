import { useRouter } from "expo-router";
import { ScrollView } from "react-native";

import { Box } from "@/components/ui/box/Box";
import { HStack } from "@/components/ui/hstack/HStack";
import { LinkCard } from "@/components/ui/link-card/LinkCard";
import { Text } from "@/components/ui/text/Text";
import { VStack } from "@/components/ui/vstack/VStack";
import { linkDetailHref } from "@/constants/routes.constants";
import { formatMonthDay } from "@/utils/format";

import type { RemindLink } from "../home.types";

interface RemindSectionProps {
  links: RemindLink[];
}

/** 다시 볼 링크 — 알림을 설정한 링크를 가까운 순으로 넘겨 보는 가로 캐러셀. */
export function RemindSection({ links }: RemindSectionProps) {
  const router = useRouter();

  // 알림을 설정한 링크가 없으면 섹션 자체가 뜨지 않는다(시안 정책).
  if (links.length === 0) {
    return null;
  }

  return (
    <VStack className="gap-4">
      <Text variant="heading-1" className="px-5 text-text-strong">
        다시 볼 링크
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <HStack className="gap-3 px-5">
          {links.map((link) => (
            <RemindCard
              key={link.linkId}
              link={link}
              onPress={() => router.push(linkDetailHref(String(link.linkId)))}
            />
          ))}
        </HStack>
      </ScrollView>
    </VStack>
  );
}

interface RemindCardProps {
  link: RemindLink;
  onPress: () => void;
}

// LinkTile 과 달리 썸네일 위에 알림 날짜가 얹히고 메타 라인이 없어, 완성형 카드 대신
// LinkCard 조립 키트로 직접 조합한다.
function RemindCard({ link, onPress }: RemindCardProps) {
  return (
    <LinkCard.Root link={link} className="w-40 gap-2" onPress={onPress}>
      <Box>
        <LinkCard.Thumbnail className="h-[200px] w-40 rounded-[20px]" />
        <ReminderBadge reminderAt={link.reminderAt} />
      </Box>
      <LinkCard.Title variant="body-3" />
    </LinkCard.Root>
  );
}

function ReminderBadge({ reminderAt }: { reminderAt: string }) {
  return (
    <Box className="absolute top-2 left-2 h-[26px] justify-center rounded-full bg-opacity-black-90 px-2">
      <Text variant="caption-2" className="text-opacity-white-100">
        {formatMonthDay(reminderAt)}
      </Text>
    </Box>
  );
}
