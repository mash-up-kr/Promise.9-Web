import { setTokenPersistence } from "@shared/api";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { HeaderScrollProvider } from "@/components/ui/header/HeaderScrollProvider";
import { SnackbarProvider } from "@/components/ui/snackbar/SnackbarProvider";
import { CONTENT_MAX_WIDTH } from "@/constants/layout.constants";
import { isWeb } from "@/constants/platform.constants";
import { useAuthGate } from "@/features/auth/hooks/useAuthGate";
import { SplashOverlay } from "@/features/splash/components/SplashOverlay";
import { useSplashPhase } from "@/features/splash/hooks/useSplashPhase";
import { setupOnlineManager } from "@/lib/online-manager";
import { queryClient } from "@/lib/queryClient";
import { tokenPersistence } from "@/lib/tokenStorage";
import "@/global.css";

SplashScreen.preventAutoHideAsync();

// 리프레시 토큰 영속 저장소 주입 — @/lib/tokenStorage 는 플랫폼별로 갈린다
// (네이티브: expo-secure-store · 웹: tokenStorage.web.ts, localStorage).
setTokenPersistence(tokenPersistence);
setupOnlineManager();

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

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Pretendard: require("../../assets/fonts/Pretendard-Regular.ttf"),
    "Pretendard-Medium": require("../../assets/fonts/Pretendard-Medium.ttf"),
    "Pretendard-SemiBold": require("../../assets/fonts/Pretendard-SemiBold.ttf"),
    "Pretendard-Bold": require("../../assets/fonts/Pretendard-Bold.ttf"),
  });

  // 초기화(폰트 + 인증 상태 확인)가 끝날 때까지 스플래시를 유지한다.
  // 홈/로그인 분기는 (tabs) 의 인증 가드가 스플래시 아래에서 처리한다.
  // 웹은 스플래시를 노출하지 않는다(웹 관례상 인위적 대기 없이 다크 배경만) —
  // 실제 초기화가 짧아 최소 노출을 빼면 마스코트가 깜빡이는 플리커만 남는다.
  const isSplashEnabled = !isWeb;
  const authStatus = useAuthGate();
  const splashPhase = useSplashPhase(fontsLoaded && authStatus !== "checking");

  if (!fontsLoaded) {
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
                    <Stack
                      screenOptions={{
                        contentStyle: { backgroundColor: "transparent" },
                      }}
                    >
                      <Stack.Screen
                        name="(tabs)"
                        options={{ headerShown: false }}
                      />
                      <Stack.Screen
                        name="(auth)"
                        options={{ headerShown: false }}
                      />
                      <Stack.Screen
                        name="create-link"
                        options={sheetScreenOptions}
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
                    </Stack>
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
