import { Redirect } from "expo-router";
import { isWeb } from "@/constants/platform.constants";
import { ROUTES } from "@/constants/routes.constants";
import { AppInstallSheet } from "@/features/app-install/AppInstallSheet";

export default function Route() {
  // 앱 안에서는 이미 설치된 것이라 안내할 게 없다.
  if (!isWeb) return <Redirect href={ROUTES.HOME} />;
  return <AppInstallSheet />;
}
