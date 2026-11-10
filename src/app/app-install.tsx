import { useEffect } from "react";
import { useSheetRouteNavigation } from "@/components/ui/sheet-screen/useSheetRouteNavigation";
import { isWeb } from "@/constants/platform.constants";
import { AppInstallSheet } from "@/features/app-install/AppInstallSheet";

export default function Route() {
  // 앱 안에서는 이미 설치된 것이라 안내할 게 없다.
  if (!isWeb) return <CloseImmediately />;
  return <AppInstallSheet />;
}

// 홈으로 Redirect 하면 모달 자리에 홈이 하나 더 쌓인다 — 이 라우트만 닫는다.
function CloseImmediately() {
  const { closeSheet } = useSheetRouteNavigation();
  useEffect(() => {
    closeSheet();
  }, [closeSheet]);
  return null;
}
