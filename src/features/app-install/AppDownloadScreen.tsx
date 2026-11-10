import { Text } from "@promise9/ui/text/Text";
import { getMobileOS, getStoreUrl } from "@shared/app-install/appInstall.utils";
import { useEffect } from "react";
import { View } from "react-native";
import { AppInstallContent } from "./components/AppInstallContent";

/**
 * 웹 `/app` — QR·짧은 주소가 가리키는 설치 주소. 기기에 맞는 스토어로 보내고, 스토어 안내도 함께 그린다
 * (이동이 막히거나 스토어에서 돌아와도 누를 곳이 남게).
 */
export function AppDownloadScreen() {
  const storeUrl = getStoreUrl(getMobileOS(navigator.userAgent));

  useEffect(() => {
    // 뒤로가기로 이 주소에 되돌아와 다시 튕겨 나가지 않게 히스토리를 교체한다.
    if (storeUrl) window.location.replace(storeUrl);
  }, [storeUrl]);

  return (
    <View className="flex-1 items-center justify-center gap-6 bg-background-base px-5">
      <Text variant="heading-1" className="text-center text-text-strong">
        링띵동 앱을 설치해 보세요
      </Text>
      <AppInstallContent variant="mobile" />
    </View>
  );
}
