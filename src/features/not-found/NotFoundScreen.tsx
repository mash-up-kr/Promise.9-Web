import { ActionButton } from "@promise9/ui/action-button/ActionButton";
import { EmptyState } from "@promise9/ui/empty-state/EmptyState";
import { Stack, useRouter } from "expo-router";
import { View } from "react-native";
import { Illustration } from "@/components/ui/illustration/Illustration";
import { ROUTES } from "@/constants/routes.constants";
import { useAuthGate } from "@/features/auth/hooks/useAuthGate";

export function NotFoundScreen() {
  const router = useRouter();
  // 홈은 보호 라우트라 로그인 안 된 상태에선 홈으로의 이동이 무시된다 — 로그인으로 직접 보낸다.
  const isSignedOut = useAuthGate() === "unauthenticated";

  return (
    <View className="flex-1 items-center justify-center bg-background-base">
      <Stack.Screen options={{ headerShown: false }} />
      <EmptyState
        illustration={<Illustration name="error" />}
        title="페이지를 찾을 수 없어요"
        description="주소가 잘못되었거나 삭제된 페이지예요"
        action={
          // 히스토리를 교체해 뒤로가기로 404 에 되돌아오지 않게 한다.
          <ActionButton
            size="small"
            onPress={() =>
              router.replace(isSignedOut ? ROUTES.LOGIN : ROUTES.HOME)
            }
          >
            {isSignedOut ? "로그인하러 가기" : "홈으로 가기"}
          </ActionButton>
        }
      />
    </View>
  );
}
