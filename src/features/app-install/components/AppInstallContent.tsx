import { AppInstallQr } from "@promise9/ui/app-install/AppInstallQr";
import {
  APP_STORE_URL,
  IS_PLAY_STORE_RELEASED,
  PLAY_STORE_URL,
} from "@shared/app-install/appInstall.constants";
import { Pressable, View } from "react-native";
import { Image } from "@/components/ui/image/Image";
import { openExternalUrl } from "@/utils/openExternalUrl";

export interface AppInstallContentProps {
  /** mobile: 스토어 배지 · desktop: QR + 짧은 주소. 기기 판별은 담는 쪽이 한다. */
  variant: "mobile" | "desktop";
}

// Figma Bottom Sheet Content/App Install. 좌우 여백은 담는 쪽(시트)이 준다.
export function AppInstallContent({ variant }: AppInstallContentProps) {
  return variant === "mobile" ? <StoreBadges /> : <AppInstallQr />;
}

// 공식 배지는 원본 비율 그대로 높이 48 — 둘레 여백은 배지 높이의 1/4(12) 이상이어야 한다.
function StoreBadges() {
  return (
    <View className="flex-row flex-wrap justify-center gap-4 pt-1 pb-5">
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="App Store에서 다운로드하기"
        onPress={() => openExternalUrl(APP_STORE_URL)}
      >
        <Image
          source={require("@/assets/images/store-badges/app-store-badge-ko.svg")}
          contentFit="contain"
          className="h-12 w-[155.64px]"
        />
      </Pressable>
      {IS_PLAY_STORE_RELEASED && (
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Google Play에서 다운로드"
          onPress={() => openExternalUrl(PLAY_STORE_URL)}
        >
          <Image
            source={require("@/assets/images/store-badges/google-play-badge-ko.png")}
            contentFit="contain"
            className="h-12 w-[161.5px]"
          />
        </Pressable>
      )}
    </View>
  );
}
