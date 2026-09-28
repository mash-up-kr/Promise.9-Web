import { setTokenPersistence } from "@shared/api";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import type { ReactNode } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { HeaderScrollProvider } from "@/components/ui/header/HeaderScrollProvider";
import {
  SnackbarOutlet,
  SnackbarProvider,
} from "@/components/ui/snackbar/SnackbarProvider";
import { CONTENT_MAX_WIDTH } from "@/constants/layout.constants";
import { isWeb } from "@/constants/platform.constants";
import { AuthGateProvider } from "@/features/auth/AuthGateContext";
import { useAuthGate } from "@/features/auth/hooks/useAuthGate";
import { SplashOverlay } from "@/features/splash/components/SplashOverlay";
import { useSplashPhase } from "@/features/splash/hooks/useSplashPhase";
import { setupFocusManager } from "@/lib/focus-manager";
import { setupOnlineManager } from "@/lib/online-manager";
import { queryClient } from "@/lib/queryClient";
import { tokenPersistence } from "@/lib/tokenStorage";
import "@/global.css";

SplashScreen.preventAutoHideAsync();

// 리프레시 토큰 영속 저장소 주입 — @/lib/tokenStorage 는 플랫폼별로 갈린다
// (네이티브: expo-secure-store · 웹: tokenStorage.web.ts, localStorage).
setTokenPersistence(tokenPersistence);
setupOnlineManager();
setupFocusManager();

const transparentBackgroundTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: "transparent" },
};

// 오버레이 라우트(create-link · create-folder · edit-folder · move-links) 공통 옵션 —
// 전 OS 투명 모달로 연다. 그 위에 무엇을 그릴지는 화면이 정한다: create-link·move-links 는
// gorhom 바텀시트(backdrop·그래버·detent·키보드까지 그린다), 폴더 생성·편집은 화면 중앙 카드.
const sheetScreenOptions = {
  presentation: "transparentModal" as const,
  headerShown: false,
  animation: "none" as const,
  contentStyle: { backgroundColor: "transparent" },
};

// iOS 는 투명 모달 라우트를 네이티브 모달로 띄워 루트에 그린 스낵바가 그 아래에 깔린다 —
// 열려 있는 동안의 스낵바는 그 화면 안의 자리에 그린다(Android·웹은 SnackbarOutlet 이 아무것도 그리지 않는다).
function renderScreenLayout({
  children,
  options,
}: {
  children: ReactNode;
  options: { presentation?: string };
}) {
  return (
    <>
      {children}
      {options.presentation === "transparentModal" && <SnackbarOutlet />}
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Pretendard: require("../../assets/fonts/Pretendard-Regular.ttf"),
    "Pretendard-Medium": require("../../assets/fonts/Pretendard-Medium.ttf"),
    "Pretendard-SemiBold": require("../../assets/fonts/Pretendard-SemiBold.ttf"),
    "Pretendard-Bold": require("../../assets/fonts/Pretendard-Bold.ttf"),
  });

  // 초기화(폰트 + 인증 상태 확인)가 끝날 때까지 스플래시를 유지하고 내비게이터도 띄우지 않는다 —
  // 확인 중에 띄우면 보호 라우트가 빠진 채 로그인이 첫 화면으로 잡혀 인증 뒤에도 거기 머문다.
  // 홈/로그인 분기는 아래 Stack.Protected 가 한다.
  // 웹은 스플래시를 노출하지 않는다(웹 관례상 인위적 대기 없이 다크 배경만) —
  // 실제 초기화가 짧아 최소 노출을 빼면 마스코트가 깜빡이는 플리커만 남는다.
  const isSplashEnabled = !isWeb;
  const authStatus = useAuthGate();
  const splashPhase = useSplashPhase(fontsLoaded && authStatus !== "checking");

  if (!fontsLoaded || authStatus === "checking") {
    return (
      <View className="flex-1 bg-background-base">
        {isSplashEnabled && <SplashOverlay isFadingOut={false} />}
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView className="flex-1 bg-background-base">
        <SafeAreaProvider>
          <KeyboardProvider>
            {/* 웹에서 앱 폭을 제한하고 중앙 정렬한다. 네이티브는 화면보다 넓어 영향 없음.
                Modal 위치 보정(Popover)이 같은 상수를 참조하므로 리터럴 대신 상수를 쓴다. */}
            <View
              className="mx-auto w-full flex-1"
              style={{ maxWidth: CONTENT_MAX_WIDTH }}
            >
              <SnackbarProvider>
                <HeaderScrollProvider>
                  <ThemeProvider value={transparentBackgroundTheme}>
                    <AuthGateProvider status={authStatus}>
                      <Stack
                        screenOptions={{
                          contentStyle: { backgroundColor: "transparent" },
                        }}
                        screenLayout={renderScreenLayout}
                      >
                        {/* 앱 스킴으로는 (tabs) 밖 라우트도 바로 열린다 — 로그인 안 된 상태면 보호 라우트가
                            내비게이터에서 빠져 (auth) 가 첫 화면이 되고, 화면 위에서 세션이 끊겨도
                            (refresh 실패 → clearTokens) 같은 길로 나간다. */}
                        <Stack.Protected guard={authStatus === "authenticated"}>
                          <Stack.Screen
                            name="(tabs)"
                            options={{ headerShown: false }}
                          />
                          <Stack.Screen
                            name="create-folder"
                            options={sheetScreenOptions}
                          />
                          <Stack.Screen
                            name="edit-folder"
                            options={sheetScreenOptions}
                          />
                          <Stack.Screen
                            name="move-links"
                            options={sheetScreenOptions}
                          />
                          <Stack.Screen name="link/[id]" />
                          <Stack.Screen name="archive/[id]" />
                          <Stack.Screen name="search" />
                          <Stack.Screen name="settings/withdraw" />
                          <Stack.Screen name="support" />
                        </Stack.Protected>
                        <Stack.Screen
                          name="(auth)"
                          options={{ headerShown: false }}
                        />
                        {/* 약관·개인정보처리방침은 로그인 화면에서도 연다. */}
                        <Stack.Screen name="settings/terms" />
                        <Stack.Screen name="settings/privacy" />
                        {/* 저장 시트는 로그인 안 된 딥링크에서 공유 URL 을 next 로 들고 로그인으로 가야 해서
                            보호 밖에서 라우트가 직접 가른다(create-link.tsx). */}
                        <Stack.Screen
                          name="create-link"
                          options={sheetScreenOptions}
                        />
                      </Stack>
                    </AuthGateProvider>
                  </ThemeProvider>
                </HeaderScrollProvider>
              </SnackbarProvider>
            </View>
          </KeyboardProvider>
        </SafeAreaProvider>
        {isSplashEnabled && splashPhase !== "hidden" && (
          <SplashOverlay isFadingOut={splashPhase === "fading"} />
        )}
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
