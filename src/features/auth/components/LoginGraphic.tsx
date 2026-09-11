import { Image } from "expo-image";
import { View } from "react-native";

// 디자이너 주석: "그래픽에 변경사항이 생길 경우 교체 요청" → 그래픽은 단일 교체 가능한 PNG 로 둔다.
const characterSource = require("../../../../assets/images/login-character.png");

// Figma "Group 9858"(375 아트보드 기준) 그래픽 본체 크기. PNG(480×384)와 5:4 비율이 같아 그대로 축소된다.
const GRAPHIC_WIDTH = 120;
const GRAPHIC_HEIGHT = 96;

/** 로그인 상단 히어로: LDD 그래픽. */
export function LoginGraphic() {
  return (
    <View className="items-center">
      <Image
        source={characterSource}
        contentFit="contain"
        style={{ width: GRAPHIC_WIDTH, height: GRAPHIC_HEIGHT }}
        accessibilityLabel="링띵동 캐릭터"
      />
    </View>
  );
}
