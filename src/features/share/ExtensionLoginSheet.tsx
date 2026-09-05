import type { SocialProvider } from "@shared/api";
import { Image, StyleSheet, View } from "react-native";

import { SOCIAL_PROVIDERS } from "@/features/auth/auth.constants";
import { AgreementText } from "@/features/auth/components/AgreementText";
import { SocialLoginButton } from "@/features/auth/components/SocialLoginButton";

import { SheetText, sheetStyles } from "./sheet.primitives";
import { useExtensionSocialLogin } from "./useExtensionSocialLogin";

export const EXTENSION_LOGIN_SHEET_HEIGHT = 520;

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
    <View style={[sheetStyles.container, sheetStyles.resultContainer]}>
      <View style={sheetStyles.handle} />
      <View style={sheetStyles.resultBody}>
        <Image
          testID="share-login-graphic"
          source={LOGIN_GRAPHIC}
          style={styles.graphic}
        />
        <SheetText style={sheetStyles.resultTitle}>로그인이 필요해요</SheetText>
        <SheetText style={sheetStyles.resultSubtitle}>
          {isSessionExpired
            ? "다시 로그인해주세요"
            : "로그인하면 이 링크를 바로 저장할 수 있어요"}
        </SheetText>
      </View>
      <View style={styles.buttons}>
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
        <SheetText style={styles.error}>{errorMessage}</SheetText>
      )}
      <View style={styles.agreement}>
        <AgreementText />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  graphic: {
    width: 120,
    height: 120,
  },
  buttons: {
    gap: 12,
  },
  error: {
    color: "#ff6b6b",
    fontSize: 13,
    textAlign: "center",
    marginTop: 12,
  },
  agreement: {
    marginTop: 16,
  },
});
