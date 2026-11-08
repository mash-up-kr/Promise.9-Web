import { getMobileOS } from "@shared/app-install/appInstall.utils";
import { BottomSheetHeader } from "@/components/ui/bottom-sheet/BottomSheetHeader";
import { SheetScreen } from "@/components/ui/sheet-screen/SheetScreen";
import { useSheetRouteNavigation } from "@/components/ui/sheet-screen/useSheetRouteNavigation";
import { AppInstallContent } from "./components/AppInstallContent";

/** 웹 사용자에게 앱 설치를 안내하는 바텀시트 — 휴대폰은 스토어 배지, 그 외는 QR. */
export function AppInstallSheet() {
  const { closeSheet } = useSheetRouteNavigation();
  const isMobile = getMobileOS(navigator.userAgent) !== null;

  return (
    <SheetScreen
      onClose={closeSheet}
      header={
        <BottomSheetHeader
          title="앱에서 푸시 알림을 받아보세요!"
          description="리마인드를 앱 알림으로 받을 수 있어요."
        />
      }
    >
      <AppInstallContent variant={isMobile ? "mobile" : "desktop"} />
    </SheetScreen>
  );
}
