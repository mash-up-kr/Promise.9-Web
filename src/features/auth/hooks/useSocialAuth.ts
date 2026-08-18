import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { login as kakaoLogin } from "@react-native-seoul/kakao-login";
import { useCallback } from "react";

import type { SocialProvider } from "../auth.constants";
import { SocialLoginCancelledError } from "../auth.errors";

// 웹 구현(useSocialAuth.web.ts)과 export 표면을 맞춘다 — 화면은 어느 쪽이 로드되든 같은 import 를 쓴다.
export { SocialLoginCancelledError };

let isGoogleConfigured = false;

function ensureGoogleConfigured() {
  if (isGoogleConfigured) return;
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  // webClientId 는 idToken 발급에 필수다(SDK 문서 기준). 없으면 SDK 내부 에러로 새어나가
  // 원인을 알기 어려우므로, 웹 구현(useSocialAuth.web.ts)과 같은 톤으로 미리 막는다.
  // iosClientId 는 선택이라(GoogleService-Info.plist 로 대체 가능) 검증하지 않는다.
  if (!webClientId) {
    throw new Error("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID 가 설정되지 않았습니다.");
  }
  GoogleSignin.configure({
    webClientId,
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

// idToken 발급 자체는 되지만, 서버가 아직 카카오를 지원하지 않아(POST /auth/social 이
// provider=kakao 에 950004 반환) SOCIAL_PROVIDERS 에서 버튼은 비활성 — 서버 연결 시 플래그만 켠다.
//
// 카카오 SDK 는 취소를 구분하는 신호를 문서화하지 않는다 — 임의로 추측해 분기하지 않고
// 모든 실패를 그대로 전파한다(구글과 달리 사용자가 취소해도 일반 실패 안내가 뜬다).
async function getKakaoIdToken(): Promise<string> {
  const token = await kakaoLogin();
  if (!token.idToken) {
    throw new Error("카카오 로그인 응답에 idToken 이 없습니다.");
  }
  return token.idToken;
}

export function useSocialAuth() {
  const getIdToken = useCallback(
    async (provider: SocialProvider): Promise<string> => {
      switch (provider) {
        case "google":
          return getGoogleIdToken();
        case "kakao":
          return getKakaoIdToken();
        case "apple":
          // 애플 로그인은 UI 만 준비(SOCIAL_PROVIDERS 비활성) — 서버 계약·SDK 연동 전까지 호출되지 않는다.
          throw new Error("애플 로그인은 아직 지원하지 않습니다.");
      }
    },
    [],
  );

  return { getIdToken };
}
