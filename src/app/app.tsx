import { Redirect } from "expo-router";
import { isWeb } from "@/constants/platform.constants";
import { ROUTES } from "@/constants/routes.constants";
import { AppDownloadScreen } from "@/features/app-install/AppDownloadScreen";
import { useAuthGateContext } from "@/features/auth/AuthGateContext";

export default function Route() {
  const { status } = useAuthGateContext();

  // 앱 스킴으로 열리면 이미 설치된 것이라 안내할 게 없다 — 첫 화면으로 보낸다.
  if (!isWeb) {
    return (
      <Redirect
        href={status === "authenticated" ? ROUTES.HOME : ROUTES.LOGIN}
      />
    );
  }
  return <AppDownloadScreen />;
}
