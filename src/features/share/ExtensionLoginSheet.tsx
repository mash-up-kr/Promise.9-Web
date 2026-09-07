import type { SocialProvider } from "@shared/api";
import { Image, View } from "react-native";

import { Text } from "@/components/ui/text/Text";
import { LEGAL_ROUTES } from "@/constants/routes.constants";
import { SOCIAL_PROVIDERS } from "@/features/auth/auth.constants";
import { AgreementText } from "@/features/auth/components/AgreementText";
import { SocialLoginButton } from "@/features/auth/components/SocialLoginButton";

import { SheetBody } from "./components/SheetBody";
import { openHostApp } from "./shareHost";
import { useExtensionSocialLogin } from "./useExtensionSocialLogin";

// 미로그인 시안 확정 전 임시 그래픽 — 결과 시트 4종 중 경고 배지가 없는 쪽을 쓴다.
const LOGIN_GRAPHIC = require("@/assets/images/share/result-retry-limit.png");

export interface ExtensionLoginSheetProps {
  sharedUrl: string;
  isSessionExpired: boolean;
}

export function ExtensionLoginSheet({
  sharedUrl,
  isSessionExpired,
}: ExtensionLoginSheetProps) {
  const { login, pendingProvider, errorMessage } =
    useExtensionSocialLogin(sharedUrl);

  return (
    <SheetBody>
      <View className="gap-6">
        <View className="items-center gap-2 py-6">
          <Image
            testID="share-login-graphic"
            source={LOGIN_GRAPHIC}
            className="size-30"
          />
          <Text variant="heading-2" className="text-text-strong">
            로그인이 필요해요
          </Text>
          <Text variant="body-2-reading" className="text-text-alternative">
            {isSessionExpired
              ? "다시 로그인해주세요"
              : "로그인하면 이 링크를 바로 저장할 수 있어요"}
          </Text>
        </View>
        <View className="gap-3">
          {Object.entries(SOCIAL_PROVIDERS)
            .filter(([, config]) => config.enabled)
            .map(([key, config]) => {
              const provider = key as SocialProvider;
              return (
                <SocialLoginButton
                  key={provider}
                  provider={provider}
                  label={config.label}
                  onPress={login}
                  loading={pendingProvider === provider}
                  disabled={
                    pendingProvider !== null && pendingProvider !== provider
                  }
                />
              );
            })}
        </View>
        {errorMessage !== null && (
          <Text
            variant="label-2-medium"
            className="mt-3 text-center text-action-destructive"
          >
            {errorMessage}
          </Text>
        )}
        <View className="mt-4">
          {/* 익스텐션엔 라우터가 없다 — 본 앱을 해당 문서 화면으로 연다(openHostApp 은 스킴 뒤 경로라 선행 슬래시 없이). */}
          <AgreementText
            onOpenLegal={(kind) => openHostApp(LEGAL_ROUTES[kind].slice(1))}
          />
        </View>
      </View>
    </SheetBody>
  );
}
