import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { DarkTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { SnackbarProvider } from "@/components/ui/snackbar/SnackbarProvider";
import { isWeb } from "@/constants/platform.constants";
import { queryClient } from "@/lib/queryClient";
import "@/global.css";

SplashScreen.preventAutoHideAsync();

// 디자인 토큰이 다크 전용이라 시스템 테마와 무관하게 다크로 고정한다.
// 시스템 라이트 모드의 Android 는 투명 씬 아래로 밝은 네이티브 배경이 비쳐서
// (--color-background-base) 씬 배경을 명시적으로 칠한다. app.json 의
// userInterfaceStyle: "dark" 와 세트.
const BACKGROUND_BASE = "#0e0e13";

const darkFixedTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: BACKGROUND_BASE },
};

// 바텀시트 형태로 띄우는 라우트 공통 옵션 (create-link · create-folder).
const sheetScreenOptions = isWeb
  ? {
      presentation: "transparentModal" as const,
      headerShown: false,
      animation: "none" as const,
      contentStyle: { backgroundColor: "transparent" },
    }
  : {
      presentation: "formSheet" as const,
      headerShown: false,
      // Figma 기본 시트 높이(≈65%)로 열고, 그래버로 확장 가능하게 둔다.
      sheetAllowedDetents: [0.65, 0.9],
      sheetGrabberVisible: true,
      sheetCornerRadius: 24,
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
                <ThemeProvider value={darkFixedTheme}>
                  <Stack
                    screenOptions={{
                      contentStyle: { backgroundColor: BACKGROUND_BASE },
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
