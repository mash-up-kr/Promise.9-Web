import { View } from "react-native";

import { Heading } from "@/components/ui/heading/Heading";

import { SOCIAL_PROVIDERS, type SocialProvider } from "./auth.constants";
import { SocialLoginButton } from "./components/SocialLoginButton";

// TODO(#53): PR #52(shared/api/token.ts) 머지 + Google Cloud OAuth 클라이언트 발급 후
// useSocialAuth(네이티브 SDK → idToken) + useSocialLoginMutation(POST /auth/social) 연결.
function handleSocialLogin(_provider: SocialProvider) {}

export function LoginScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-8 p-6">
      <Heading size="2xl">로그인</Heading>
      <View className="w-full gap-3">
        {SOCIAL_PROVIDERS.filter((p) => p.enabled).map((p) => (
          <SocialLoginButton
            key={p.provider}
            provider={p.provider}
            label={p.label}
            onPress={handleSocialLogin}
          />
        ))}
      </View>
    </View>
  );
}
