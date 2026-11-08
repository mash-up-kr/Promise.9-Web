import { View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { Text } from "../text/Text";
import {
  APP_INSTALL_QR_PATH,
  APP_INSTALL_QR_VIEW_BOX,
  APP_INSTALL_SHORT_URL,
} from "./appInstallQr.constants";

// Figma Bottom Sheet Content/App Install, Device=Desktop — 데스크톱 웹·크롬 익스텐션 공용.
// 좌우 여백은 담는 쪽(시트)이 준다. QR 은 스캔돼야 하므로 토큰 대신 순수 검정으로 그린다.
export function AppInstallQr() {
  return (
    <View className="items-center gap-3 pt-1 pb-5">
      <View className="rounded-2xl bg-opacity-white-100 p-3">
        <Svg
          accessibilityRole="image"
          accessibilityLabel="앱 설치 QR 코드"
          viewBox={APP_INSTALL_QR_VIEW_BOX}
          width={116}
          height={116}
        >
          <Path d={APP_INSTALL_QR_PATH} stroke="#000000" />
        </Svg>
      </View>
      <View className="w-full items-center gap-1">
        <Text variant="body-2-normal" className="text-center">
          휴대폰 카메라로 스캔해 주세요
        </Text>
        <Text variant="body-3" className="text-center">
          {APP_INSTALL_SHORT_URL}
        </Text>
      </View>
    </View>
  );
}
