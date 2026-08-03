import { setTokenPersistence } from "@shared/api";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { SnackbarProvider } from "@/components/ui/snackbar/SnackbarProvider";
import { queryClient } from "@/lib/queryClient";
import { tokenPersistence } from "@/lib/tokenStorage";
import "@/global.css";

SplashScreen.preventAutoHideAsync();

// 리프레시 토큰 영속 저장소 주입 — @/lib/tokenStorage 는 플랫폼별로 갈린다
// (네이티브: expo-secure-store · 웹: tokenStorage.web.ts, localStorage).
setTokenPersistence(tokenPersistence);

const transparentBackgroundTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: "transparent" },
};

// 바텀시트 라우트(create-link · create-folder) 공통 옵션.
// 전 OS 투명 모달로 열고, 시트 크롬(backdrop·그래버·detent·키보드)은 gorhom BottomSheet 가 그린다.
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

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView className="flex-1 bg-background-base">
        <SafeAreaProvider>
          <KeyboardProvider>
            {/* 웹에서 앱 폭을 768px 로 제한하고 중앙 정렬한다. 네이티브는 화면보다 넓어 영향 없음. */}
            <View className="mx-auto w-full max-w-[768px] flex-1">
              <SnackbarProvider>
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
                  </Stack>
                </ThemeProvider>
              </SnackbarProvider>
            </View>
          </KeyboardProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
