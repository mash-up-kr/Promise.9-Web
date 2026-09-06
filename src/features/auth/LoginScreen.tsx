import type { Href } from "expo-router";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSnackbar } from "@/components/ui/snackbar/SnackbarProvider";
import {
  ROUTES,
  SHARE_LOGIN_NEXT_CREATE_LINK,
} from "@/constants/routes.constants";

import { useSocialLoginMutation } from "./api/auth.queries";
import { SOCIAL_PROVIDERS, type SocialProvider } from "./auth.constants";
import {
  isUnsupportedProviderError,
  SocialLoginCancelledError,
} from "./auth.errors";
import { AgreementText } from "./components/AgreementText";
import { ExtensionConnect } from "./components/ExtensionConnect";
import { LoginGraphic } from "./components/LoginGraphic";
import { SocialLoginButton } from "./components/SocialLoginButton";
import { canConnectExtension, isExtensionReturn } from "./extensionHandoff";
import { useAuthGate } from "./hooks/useAuthGate";
import { useSocialAuth } from "./hooks/useSocialAuth";

const LOGIN_FAILED_MESSAGE = "로그인에 실패했어요. 다시 시도해주세요.";

export function LoginScreen() {
  const router = useRouter();
  // 크롬 익스텐션이 열었으면 `?return=extension` 이 붙어 온다 — 로그인 결과를 익스텐션에도 넘긴다.
  // 다만 받을 익스텐션이 없는 환경(확장 ID 미설정·크롬 아님)이면 인계를 건너뛰고 평범한 웹
  // 로그인으로 진행한다 — 성공할 수 없는 연결 화면에 세우면 로그인만 하고 갇힌다.
  // 공유 익스텐션 인계는 `next`(화이트리스트 키)와 공유 URL(`share`)로 들어온다.
  const {
    return: returnTo,
    next,
    share,
  } = useLocalSearchParams<{
    return?: string;
    next?: string;
    share?: string;
  }>();
  const isExtensionConnect =
    isExtensionReturn(returnTo) && canConnectExtension();
  // 익스텐션이 연 탭이면 기존 로그인 여부부터 본다 — 있으면 소셜 로그인 없이 바로 연결한다.
  const authStatus = useAuthGate();
  const insets = useSafeAreaInsets();
  const { show } = useSnackbar();
  const { getIdToken } = useSocialAuth();
  const { mutate } = useSocialLoginMutation();
  const [pendingProvider, setPendingProvider] = useState<SocialProvider | null>(
    null,
  );
  // 공유 익스텐션 인계: next 가 화이트리스트 키면 공유 URL(share)을 들고 저장 시트로, 아니면 홈.
  const destination: Href =
    next === SHARE_LOGIN_NEXT_CREATE_LINK && typeof share === "string"
      ? { pathname: ROUTES.CREATE_LINK, params: { share } }
      : ROUTES.HOME;
  // 방금 로그인에 성공한 익스텐션 탭 — authStatus 는 마운트 시점 값이라 따로 기억한다.
  const [connectAfterLogin, setConnectAfterLogin] = useState(false);
  // 저장된 리프레시 토큰이 서버에서 이미 폐기된 경우. authStatus 는 토큰의 존재만 보므로
  // 연결을 시도해봐야 알 수 있고, 알고 나면 소셜 로그인으로 되돌려야 한다.
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  const handleSessionExpired = useCallback(() => {
    setIsSessionExpired(true);
    setConnectAfterLogin(false);
  }, []);

  const handleSocialLogin = async (provider: SocialProvider) => {
    setPendingProvider(provider);

    let idToken: string;
    try {
      idToken = await getIdToken(provider);
    } catch (error) {
      setPendingProvider(null);
      // 사용자가 로그인 창을 직접 닫은 경우 — 실패가 아니므로 조용히 무시한다.
      if (error instanceof SocialLoginCancelledError) return;
      // 스낵바는 원인 불문 같은 문구라, provider 와 실제 원인(미설정 env·팝업 차단·state 불일치 등)을
      // 개발 콘솔에 남긴다 — 이게 없으면 어느 provider 가 왜 실패했는지 단서가 사라진다.
      console.error("소셜 로그인 실패", provider, error);
      show({ message: LOGIN_FAILED_MESSAGE });
      return;
    }

    mutate(
      { provider, idToken },
      {
        onSuccess: () => {
          setPendingProvider(null);
          // 익스텐션 탭이면 홈 대신 연결 화면으로 — 연결이 끝나면 익스텐션이 이 탭을 닫는다.
          if (isExtensionConnect) {
            setConnectAfterLogin(true);
            return;
          }
          // TODO(#53): 온보딩 화면이 생기면 isNewUser 로 분기한다. 지금은 신규·기존 모두 홈으로.
          router.replace(destination);
        },
        onError: (error) => {
          setPendingProvider(null);
          // 서버 검증 실패도 원인 불문 같은 토스트라, provider·실제 원인(errorCode·status)을 콘솔에 남긴다.
          console.error("소셜 로그인 실패", provider, error);
          const message = isUnsupportedProviderError(error)
            ? "아직 지원하지 않는 로그인 방식이에요."
            : LOGIN_FAILED_MESSAGE;
          show({ message });
        },
      },
    );
  };

  // 익스텐션이 연 탭: 로그인된 계정이 있으면(기존이든 방금이든) 소셜 로그인 대신 연결 화면을 보인다.
  if (isExtensionConnect) {
    if (
      connectAfterLogin ||
      (authStatus === "authenticated" && !isSessionExpired)
    ) {
      return <ExtensionConnect onUnauthenticated={handleSessionExpired} />;
    }
    // 기존 로그인 확인 중 — 소셜 버튼이 먼저 번쩍이지 않게 잠깐 비워 둔다.
    if (authStatus === "checking") return null;
  }

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
        {Object.entries(SOCIAL_PROVIDERS)
          // 미지원 플랫폼의 provider(웹·안드로이드의 애플)는 노출하지 않는다.
          .filter(([, config]) => config.enabled)
          .map(([key, config]) => {
            const provider = key as SocialProvider;
            return (
              <SocialLoginButton
                key={provider}
                provider={provider}
                label={config.label}
                onPress={handleSocialLogin}
                loading={pendingProvider === provider}
                // 다른 로그인 진행 중일 때만 비활성.
                disabled={
                  pendingProvider !== null && pendingProvider !== provider
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
