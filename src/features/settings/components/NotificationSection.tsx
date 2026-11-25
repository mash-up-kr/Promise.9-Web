import { AsyncBoundary } from "@promise9/ui/async-boundary/AsyncBoundary";
import { InlineNotice } from "@promise9/ui/inline-notice/InlineNotice";
import { ListGroup } from "@promise9/ui/list-group/ListGroup";
import { ListRow } from "@promise9/ui/list-row/ListRow";
import { ListSection } from "@promise9/ui/list-section/ListSection";
import { Text } from "@promise9/ui/text/Text";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { BellOff } from "lucide-react-native";
import type { PropsWithChildren } from "react";
import { View } from "react-native";
import { isWeb } from "@/constants/platform.constants";
import { ROUTES } from "@/constants/routes.constants";
import {
  notificationQueries,
  openNotificationSettings,
} from "@/lib/notifications";

export function NotificationSection() {
  return (
    <ListSection title="알림">
      {isWeb ? <WebNotificationContent /> : <AppNotificationContent />}
    </ListSection>
  );
}

function AppNotificationContent() {
  return (
    <>
      <AsyncBoundary pending={null} fallback={null}>
        <DeniedNotice />
      </AsyncBoundary>
      <NotificationGroup caption="리마인드를 설정한 시간에 알림을 보내드려요.">
        <ListRow
          label="기기 알림 설정"
          chevron
          onPress={openNotificationSettings}
        />
      </NotificationGroup>
    </>
  );
}

function WebNotificationContent() {
  const router = useRouter();
  return (
    <NotificationGroup caption="웹에서는 이메일로 알려드려요. 앱에서는 푸시 알림도 받을 수 있어요.">
      <ListRow
        label="앱 설치하고 푸시 알림 받기"
        chevron
        onPress={() => router.push(ROUTES.APP_INSTALL)}
      />
    </NotificationGroup>
  );
}

// ponytail: 시안 조건은 '기기 거부 + 계정 푸시 켜짐'이지만 계정 설정 API(서버 #151) 전이라 거부만 본다 — 서버 기본값이 켜짐이라 같은 결과.
function DeniedNotice() {
  const { data: permission } = useSuspenseQuery(
    notificationQueries.permission(),
  );
  if (permission !== "denied") return null;
  return (
    <InlineNotice
      icon={BellOff}
      message="기기 알림이 꺼져 있어 앱 푸시를 받을 수 없어요."
      action={{ label: "설정 열기", onPress: openNotificationSettings }}
    />
  );
}

interface NotificationGroupProps extends PropsWithChildren {
  caption: string;
}

function NotificationGroup({ caption, children }: NotificationGroupProps) {
  return (
    <View className="gap-2">
      <ListGroup>{children}</ListGroup>
      {/* 시안 Caption-1-regular 는 자간 0 — caption-1 토큰(0.03em)과 자간만 다르다. */}
      <Text
        variant="caption-1"
        className="px-1 text-text-alternative tracking-[0px]"
      >
        {caption}
      </Text>
    </View>
  );
}
