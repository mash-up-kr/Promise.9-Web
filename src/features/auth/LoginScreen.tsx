import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSnackbar } from "@/components/ui/snackbar/SnackbarProvider";
import { ROUTES } from "@/constants/routes.constants";

import { useSocialLoginMutation } from "./api/auth.queries";
import { SOCIAL_PROVIDERS, type SocialProvider } from "./auth.constants";
import {
  isUnsupportedProviderError,
  SocialLoginCancelledError,
} from "./auth.errors";
import { AgreementText } from "./components/AgreementText";
import { LoginGraphic } from "./components/LoginGraphic";
import { SocialLoginButton } from "./components/SocialLoginButton";
import { useSocialAuth } from "./hooks/useSocialAuth";

const LOGIN_FAILED_MESSAGE = "로그인에 실패했어요. 다시 시도해주세요.";

export function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { show } = useSnackbar();
  const { getIdToken } = useSocialAuth();
  const { mutate } = useSocialLoginMutation();
  const [pendingProvider, setPendingProvider] = useState<SocialProvider | null>(
    null,
  );

  const handleSocialLogin = async (provider: SocialProvider) => {
    setPendingProvider(provider);

    let idToken: string;
    try {
      idToken = await getIdToken(provider);
    } catch (error) {
      setPendingProvider(null);
      // 사용자가 로그인 창을 직접 닫은 경우 — 실패가 아니므로 조용히 무시한다.
      if (error instanceof SocialLoginCancelledError) return;
      show({ message: LOGIN_FAILED_MESSAGE });
      return;
    }

    mutate(
      { provider, idToken },
      {
        onSuccess: () => {
          setPendingProvider(null);
          // TODO(#53): 온보딩 화면이 생기면 isNewUser 로 분기한다. 지금은 신규·기존 모두 홈으로.
          router.replace(ROUTES.HOME);
        },
        onError: (error) => {
          setPendingProvider(null);
          const message = isUnsupportedProviderError(error)
            ? "아직 지원하지 않는 로그인 방식이에요."
            : LOGIN_FAILED_MESSAGE;
          show({ message });
        },
      },
    );
  };

  return (
    <View
      className="flex-1 bg-background-base"
      style={{
        paddingTop: insets.top,
        paddingBottom: Math.max(insets.bottom, 16),
      }}
    >
      {/* 히어로(캐릭터+로고+서브타이틀)는 남는 공간 중앙에, 버튼·약관은 하단에 고정. */}
      <View className="flex-1 justify-center px-5">
        <LoginGraphic />
      </View>

      <View className="gap-3 px-5">
        {Object.entries(SOCIAL_PROVIDERS).map(([key, config]) => {
          const provider = key as SocialProvider;
          return (
            <SocialLoginButton
              key={provider}
              provider={provider}
              label={config.label}
              onPress={handleSocialLogin}
              loading={pendingProvider === provider}
              // 미지원(카카오·애플)은 항상 비활성. 그 외엔 다른 로그인 진행 중일 때만 비활성.
              disabled={
                !config.enabled ||
                (pendingProvider !== null && pendingProvider !== provider)
              }
            />
          );
        })}
      </View>

      <View className="mt-6 px-5">
        <AgreementText />
      </View>
    </View>
  );
}
