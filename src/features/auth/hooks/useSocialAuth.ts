import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useCallback } from "react";

import type { SocialProvider } from "../auth.constants";
import { SocialLoginCancelledError } from "../auth.errors";

// 웹 구현(useSocialAuth.web.ts)과 export 표면을 맞춘다 — 화면은 어느 쪽이 로드되든 같은 import 를 쓴다.
export { SocialLoginCancelledError };

let isGoogleConfigured = false;

function ensureGoogleConfigured() {
  if (isGoogleConfigured) return;
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });
  isGoogleConfigured = true;
}

async function getGoogleIdToken(): Promise<string> {
  ensureGoogleConfigured();
  // iOS 는 SDK 내부에서 항상 true 를 반환한다 — Android Play Services 유무만 실질적으로 체크한다.
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  const response = await GoogleSignin.signIn();
  if (response.type === "cancelled") {
    throw new SocialLoginCancelledError();
  }
  const { idToken } = response.data;
  if (!idToken) {
    throw new Error("구글 로그인 응답에 idToken 이 없습니다.");
  }
  return idToken;
}

// 서버가 아직 카카오를 지원하지 않는다(POST /auth/social 이 provider=kakao 에 950004 반환) — SOCIAL_PROVIDERS 에서도 비활성.
async function getKakaoIdToken(): Promise<string> {
  throw new Error("카카오 로그인은 아직 지원하지 않습니다.");
}

export function useSocialAuth() {
  const getIdToken = useCallback(
    async (provider: SocialProvider): Promise<string> => {
      switch (provider) {
        case "google":
          return getGoogleIdToken();
        case "kakao":
          return getKakaoIdToken();
      }
    },
    [],
  );

  return { getIdToken };
}
