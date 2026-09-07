import { Stack, useRouter } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ActionButton } from "@/components/ui/action-button/ActionButton";
import { Header } from "@/components/ui/header/Header";
import { HeaderBackButton } from "@/components/ui/header/HeaderBackButton";
import { Text } from "@/components/ui/text/Text";
import { ROUTES } from "@/constants/routes.constants";
import { useAuthGate } from "@/features/auth/hooks/useAuthGate";

import { WithdrawGraphic } from "./components/WithdrawGraphic";
import { useWithdraw } from "./hooks/useWithdraw";
import { SUPPORT_EMAIL } from "./settings.constants";

export function WithdrawScreen() {
  const { withdraw, isPending } = useWithdraw();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  // 스토어 정책상 앱 없이도 삭제를 요청할 수 있는 웹페이지가 필요하다 — 웹에서 이 주소로
  // 직접 들어온 비로그인 방문자에게는 탈퇴 버튼 대신 절차를 안내한다.
  const isSignedOut = useAuthGate() === "unauthenticated";

  return (
    <View className="flex-1 bg-background-base">
      {/* 화면이 자체 헤더를 렌더하므로 네이티브 스택 헤더는 숨긴다(다른 상세 화면 선례). */}
      <Stack.Screen options={{ headerShown: false }} />
      <Header title="회원 탈퇴" left={<HeaderBackButton />} />

      {isSignedOut ? (
        <WithdrawGuide />
      ) : (
        <View className="flex-1 items-center justify-center gap-16 px-5">
          <View className="items-center gap-1">
            <Text variant="heading-2" className="text-center text-text-strong">
              링띵동을 정말 떠나시나요?
            </Text>
            <Text
              variant="body-2-normal"
              className="text-center text-text-alternative"
            >
              지금까지 저장된 링크, 폴더 내역이 모두 사라져요.
            </Text>
          </View>
          <WithdrawGraphic />
        </View>
      )}

      <View className="px-5 pt-5" style={{ paddingBottom: insets.bottom + 20 }}>
        {isSignedOut ? (
          <ActionButton
            className="w-full"
            onPress={() => router.replace(ROUTES.LOGIN)}
          >
            로그인하러 가기
          </ActionButton>
        ) : (
          <ActionButton
            variant="destructive"
            className="w-full"
            onPress={withdraw}
            isLoading={isPending}
            disabled={isPending}
          >
            탈퇴하기
          </ActionButton>
        )}
      </View>
    </View>
  );
}

function WithdrawGuide() {
  return (
    <View className="flex-1 gap-6 px-5 pt-6">
      <Text variant="heading-2" className="text-text-strong">
        탈퇴는 로그인한 뒤 진행할 수 있어요
      </Text>
      <Text variant="body-2-reading" className="text-text-normal">
        1. 링띵동에 로그인해요{"\n"}
        2. 설정 → 회원 탈퇴로 이동해요{"\n"}
        3. 탈퇴하기를 누르면 계정과 저장한 링크·폴더가 삭제돼요
      </Text>
      <Text variant="body-2-normal" className="text-text-alternative">
        탈퇴 후 개인정보는 부정 이용 방지를 위해 30일간 보관한 뒤 파기해요.
      </Text>
      <Text variant="body-2-normal" className="text-text-alternative">
        직접 진행이 어려우면 {SUPPORT_EMAIL} 으로 탈퇴를 요청할 수 있어요.
      </Text>
    </View>
  );
}
