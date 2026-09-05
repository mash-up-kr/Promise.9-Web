import type { SocialProvider } from "@shared/api";
import { useState } from "react";

import { isIOS } from "@/constants/platform.constants";
import { shareLoginHandoffPath } from "@/constants/routes.constants";
import { useSocialLoginMutation } from "@/features/auth/api/auth.queries";
import { SocialLoginCancelledError } from "@/features/auth/auth.errors";
import { useSocialAuth } from "@/features/auth/hooks/useSocialAuth";

import { openHostApp } from "./shareHost";

export const EXTENSION_LOGIN_FAILED_MESSAGE =
  "로그인에 실패했어요. 다시 시도해주세요.";

export interface ExtensionSocialLogin {
  login: (provider: SocialProvider) => Promise<void>;
  pendingProvider: SocialProvider | null;
  errorMessage: string | null;
}

// iOS 카카오는 카카오톡 앱 전환 결과가 메인 앱으로만 배달돼 익스텐션에서 끝낼 수 없다 —
// 공유 URL 을 들고 앱 로그인으로 인계하고, 앱이 저장 시트까지 이어준다.
function shouldHandOffToApp(provider: SocialProvider): boolean {
  return isIOS && provider === "kakao";
}

export function useExtensionSocialLogin(
  sharedUrl: string,
): ExtensionSocialLogin {
  const { getIdToken } = useSocialAuth();
  const { mutateAsync } = useSocialLoginMutation();
  const [pendingProvider, setPendingProvider] = useState<SocialProvider | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const login = async (provider: SocialProvider) => {
    if (shouldHandOffToApp(provider)) {
      openHostApp(shareLoginHandoffPath(sharedUrl));
      return;
    }

    setPendingProvider(provider);
    setErrorMessage(null);
    try {
      const idToken = await getIdToken(provider);
      await mutateAsync({ provider, idToken });
    } catch (error) {
      if (!(error instanceof SocialLoginCancelledError)) {
        console.error("소셜 로그인 실패", provider, error);
        setErrorMessage(EXTENSION_LOGIN_FAILED_MESSAGE);
      }
    } finally {
      setPendingProvider(null);
    }
  };

  return { login, pendingProvider, errorMessage };
}
