import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { queryClient } from "@/lib/queryClient";
import "@/global.css";

SplashScreen.preventAutoHideAsync();

const transparentBackgroundTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: "transparent" },
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
        <KeyboardProvider>
          <ThemeProvider value={transparentBackgroundTheme}>
            <Stack
              screenOptions={{
                contentStyle: { backgroundColor: "transparent" },
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen
                name="create-link"
                options={
                  Platform.OS === "web"
                    ? {
                        presentation: "transparentModal",
                        headerShown: false,
                        animation: "none",
                        contentStyle: { backgroundColor: "transparent" },
                      }
                    : {
                        presentation: "formSheet",
                        headerShown: false,
                        sheetAllowedDetents: [0.9],
                        sheetGrabberVisible: true,
                        sheetCornerRadius: 24,
                      }
                }
              />
            </Stack>
          </ThemeProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
