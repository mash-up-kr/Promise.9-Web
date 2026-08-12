import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { Heading } from "@/components/ui/heading/Heading";
import { useSnackbar } from "@/components/ui/snackbar/SnackbarProvider";
import { ROUTES } from "@/constants/routes.constants";

import {
  isUnsupportedProviderError,
  useSocialLoginMutation,
} from "./api/auth.queries";
import { SOCIAL_PROVIDERS, type SocialProvider } from "./auth.constants";
import { SocialLoginButton } from "./components/SocialLoginButton";
import {
  SocialLoginCancelledError,
  useSocialAuth,
} from "./hooks/useSocialAuth";

const LOGIN_FAILED_MESSAGE = "로그인에 실패했어요. 다시 시도해주세요.";

export function LoginScreen() {
  const router = useRouter();
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
    <View className="flex-1 items-center justify-center gap-8 p-6">
      <Heading size="2xl">로그인</Heading>
      <View className="w-full gap-3">
        {Object.entries(SOCIAL_PROVIDERS)
          .filter(([, config]) => config.enabled)
          .map(([provider, config]) => (
            <SocialLoginButton
              key={provider}
              provider={provider as SocialProvider}
              label={config.label}
              onPress={handleSocialLogin}
              disabled={pendingProvider !== null}
            />
          ))}
      </View>
    </View>
  );
}
