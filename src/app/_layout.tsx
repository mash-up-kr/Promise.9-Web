import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { HeaderScrollProvider } from "@/components/ui/header/HeaderScrollProvider";
import { SnackbarProvider } from "@/components/ui/snackbar/SnackbarProvider";
import { CONTENT_MAX_WIDTH } from "@/constants/layout.constants";
import { queryClient } from "@/lib/queryClient";
import "@/global.css";

SplashScreen.preventAutoHideAsync();

const transparentBackgroundTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: "transparent" },
};

// 오버레이 라우트(create-link · create-folder · edit-folder) 공통 옵션 — 전 OS 투명 모달로 연다.
// 그 위에 무엇을 그릴지는 화면이 정한다: create-link 는 gorhom 바텀시트(backdrop·그래버·detent·
// 키보드까지 그린다), 폴더 생성·편집은 화면 중앙 카드(FolderFormSheet).
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
                    </Stack>
                  </ThemeProvider>
                </HeaderScrollProvider>
              </SnackbarProvider>
            </View>
          </KeyboardProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
