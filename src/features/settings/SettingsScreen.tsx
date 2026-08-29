import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AlertDialog,
  AlertDialogButton,
} from "@/components/ui/alert-dialog/AlertDialog";
import { AsyncBoundary } from "@/components/ui/async-boundary/AsyncBoundary";
import { Header } from "@/components/ui/header/Header";
import { HeaderBackButton } from "@/components/ui/header/HeaderBackButton";
import { ListGroup } from "@/components/ui/list-group/ListGroup";
import { ListRow } from "@/components/ui/list-row/ListRow";
import { ListSection } from "@/components/ui/list-section/ListSection";
import { Skeleton } from "@/components/ui/skeleton/Skeleton";
import { Text } from "@/components/ui/text/Text";

import { settingsQueries } from "./api/settings.queries";
import { useLogout } from "./hooks/useLogout";
import { APP_VERSION } from "./settings.constants";

function ValueText({ children }: { children: string }) {
  return (
    <Text variant="body-2-normal" className="text-text-alternative">
      {children}
    </Text>
  );
}

// 이메일 값만 비동기다 — 행 골격은 항상 보여주고 값 자리만 서스펜드/폴백한다.
function EmailValue() {
  const { data: email } = useSuspenseQuery(settingsQueries.profile());
  return <ValueText>{email}</ValueText>;
}

export function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // 하단 플로팅 탭바(pill 60 + safe-area)에 가리지 않도록 여백을 준다.
  const bottomPadding = Math.max(insets.bottom, 20) + 60 + 16;

  const { logout, isPending: isLoggingOut } = useLogout();
  const [isLogoutOpen, setLogoutOpen] = useState(false);
  const closeLogout = () => setLogoutOpen(false);
  // logout() 은 내부에서 모든 에러를 삼키고 항상 로그인 화면으로 이동하지만(화면이
  // 언마운트됨), 그 흐름이 바뀌어도 다이얼로그가 열린 채 남지 않도록 방어적으로 닫는다.
  const confirmLogout = async () => {
    try {
      await logout();
    } finally {
      closeLogout();
    }
  };

  return (
    <View className="flex-1 bg-background-base">
      <Header title="설정" left={<HeaderBackButton />} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-8 pt-5" style={{ paddingBottom: bottomPadding }}>
          <ListSection title="계정">
            <ListGroup>
              <ListRow
                label="이메일"
                trailing={
                  <AsyncBoundary
                    pending={
                      <Skeleton testID="email-skeleton" className="h-4 w-40" />
                    }
                    fallback={<ValueText>-</ValueText>}
                  >
                    <EmailValue />
                  </AsyncBoundary>
                }
              />
              <ListRow
                label="로그아웃"
                chevron
                onPress={() => setLogoutOpen(true)}
              />
              <ListRow
                label="회원 탈퇴"
                tone="destructive"
                chevron
                onPress={() => router.push("/settings/withdraw")}
              />
            </ListGroup>
          </ListSection>

          <ListSection title="서비스">
            <ListGroup>
              <ListRow
                label="서비스 이용약관"
                chevron
                onPress={() => router.push("/settings/terms")}
              />
              <ListRow
                label="개인정보처리방침"
                chevron
                onPress={() => router.push("/settings/privacy")}
              />
              <ListRow
                label="버전 정보"
                trailing={<ValueText>{`v${APP_VERSION}`}</ValueText>}
              />
            </ListGroup>
          </ListSection>
        </View>
      </ScrollView>

      <AlertDialog
        isOpen={isLogoutOpen}
        onClose={closeLogout}
        title="로그아웃 하시겠어요?"
        actions={
          <>
            <AlertDialogButton
              label="취소"
              variant="secondary"
              onPress={closeLogout}
              disabled={isLoggingOut}
            />
            <AlertDialogButton
              label="로그아웃"
              variant="primary"
              onPress={confirmLogout}
              disabled={isLoggingOut}
            />
          </>
        }
      />
    </View>
  );
}
