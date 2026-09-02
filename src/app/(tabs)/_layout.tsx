import { Redirect, Tabs, useRouter } from "expo-router";
import { Search, Settings } from "lucide-react-native";
import { View } from "react-native";

import { Header } from "@/components/ui/header/Header";
import { HeaderActions } from "@/components/ui/header/HeaderActions";
import { IconButton } from "@/components/ui/icon-button/IconButton";
import { Logo } from "@/components/ui/logo/Logo";
import { TabBar } from "@/components/ui/tab-bar/TabBar";
import { ROUTES } from "@/constants/routes.constants";
import { useAuthGate } from "@/features/auth/hooks/useAuthGate";

export default function TabsLayout() {
  const router = useRouter();
  const authStatus = useAuthGate();

  // 저장된 리프레시 토큰이 없는(한 번도 로그인 안 한) 콜드 스타트는 탭 화면 진입 전에
  // 로그인으로 보낸다. 토큰이 있지만 만료된 경우는 401 → refresh 인터셉터가 처리한다.
  if (authStatus === "unauthenticated") {
    return <Redirect href={ROUTES.LOGIN} />;
  }

  if (authStatus === "checking") {
    return (
      <View testID="auth-gate-checking" className="flex-1 bg-background-base" />
    );
  }

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        // 헤더는 투명 프로스트라 콘텐츠가 그 아래로 스크롤되게 한다(화면별 paddingTop=useHeaderHeight).
        headerTransparent: true,
        // 시스템 라이트 모드에서 투명 씬 아래 밝은 배경이 비치지 않게 다크로 칠한다.
        // 신규 시안 base(gray-900) — sceneStyle 은 className 을 받지 못해 raw hex.
        sceneStyle: { backgroundColor: "#1a1a1a" },
        header: ({ options }) => (
          <Header title={options.title} right={<HeaderActions />} />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "홈",
          header: () => (
            <Header
              scrollScope="home"
              left={<Logo />}
              right={
                <>
                  <IconButton
                    iconNode={Search}
                    accessibilityLabel="검색"
                    onPress={() => router.navigate(ROUTES.SEARCH)}
                  />
                  <IconButton
                    iconNode={Settings}
                    accessibilityLabel="설정"
                    onPress={() => router.navigate(ROUTES.SETTINGS)}
                  />
                </>
              }
            />
          ),
        }}
      />
      {/* 보관함은 정렬 편집 모드 상태를 헤더↔리스트가 공유하므로 화면이 자체 헤더를 렌더한다. */}
      <Tabs.Screen
        name="archive"
        options={{ title: "보관함", headerShown: false }}
      />
      {/* 설정은 Figma 대로 자체 헤더(뒤로가기 + "설정")를 렌더하므로 탭 헤더는 숨긴다(보관함 선례). */}
      <Tabs.Screen
        name="settings"
        options={{ title: "세팅", headerShown: false }}
      />
    </Tabs>
  );
}
