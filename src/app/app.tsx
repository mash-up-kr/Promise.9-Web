import { useRouter } from "expo-router";
import { useEffect } from "react";
import { isWeb } from "@/constants/platform.constants";
import { ROUTES } from "@/constants/routes.constants";
import { AppDownloadScreen } from "@/features/app-install/AppDownloadScreen";
import { useAuthGateContext } from "@/features/auth/AuthGateContext";

export default function Route() {
  // 앱 스킴으로 열리면 이미 설치된 것이라 안내할 게 없다.
  if (!isWeb) return <LeaveInApp />;
  return <AppDownloadScreen />;
}

// 앱이 떠 있는 채로 열리면 이 화면만 닫는다 — 홈으로 보내면 그 위에 홈이 하나 더 쌓인다.
// 이 주소로 앱을 처음 켰으면 돌아갈 곳이 없어 첫 화면으로 보낸다.
// 스택에 이 화면이 반영된 뒤에 판단해야 해서 effect 에서 확인한다.
function LeaveInApp() {
  const { status } = useAuthGateContext();
  const router = useRouter();

  useEffect(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(status === "authenticated" ? ROUTES.HOME : ROUTES.LOGIN);
  }, [router, status]);

  return null;
}
