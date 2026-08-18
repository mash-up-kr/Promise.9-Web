import { Image } from "expo-image";
import { View } from "react-native";

import { Logo } from "@/components/ui/logo/Logo";
import { Text } from "@/components/ui/text/Text";

import { LoginSpotlight } from "./LoginSpotlight";

// 디자이너 주석: "그래픽에 변경사항이 생길 경우 교체 요청" → 캐릭터는 단일 교체 가능한 PNG 로 둔다.
const characterSource = require("../../../../assets/images/login-character.png");

const SUBTITLE = "띵동-! 필요할 때 찾아오는 당신의 링크";

// Figma Image Container(375 기준) 좌표: 캐릭터 top16, 스포트라이트 top76 — 둘 다 가로 중앙.
// 스포트라이트 apex(위·밝음)가 캐릭터 중단 뒤에서 시작해 아래로 뻗는다.
const CHARACTER_SIZE = 180;
const SPOTLIGHT_SIZE = 285;
const SPOTLIGHT_TOP = 60; // 캐릭터 top(16) 기준 상대 오프셋(76 - 16)
// 레이아웃은 캐릭터 높이만 차지하고, 빔은 아래로 overflow 시켜 로고·서브타이틀이 빔 위에 겹치게 한다(시안 배치).
const GRAPHIC_HEIGHT = CHARACTER_SIZE;

/** 로그인 상단 히어로: 스포트라이트 + 캐릭터 + 로고 + 서브타이틀. */
export function LoginGraphic() {
  return (
    <View className="items-center">
      <View
        className="relative"
        style={{ width: SPOTLIGHT_SIZE, height: GRAPHIC_HEIGHT }}
      >
        {/* 스포트라이트: 캐릭터 뒤(먼저 렌더 = 아래 레이어). */}
        <View
          className="absolute left-0"
          style={{ top: SPOTLIGHT_TOP }}
          pointerEvents="none"
        >
          <LoginSpotlight size={SPOTLIGHT_SIZE} />
        </View>
        {/* 캐릭터: 상단 중앙, 스포트라이트 위 레이어. */}
        <Image
          source={characterSource}
          contentFit="contain"
          style={{
            position: "absolute",
            top: 0,
            left: (SPOTLIGHT_SIZE - CHARACTER_SIZE) / 2,
            width: CHARACTER_SIZE,
            height: CHARACTER_SIZE,
          }}
          accessibilityLabel="링띵동 캐릭터"
        />
      </View>

      <View className="items-center gap-2">
        {/* 로그인 화면 로고는 시안상 밝은 흰색(기본 Logo 는 opacity 0.5 이라 여기선 불투명). */}
        <Logo width={70} height={30} opacity={1} />
        <Text variant="body-2-normal" className="text-text-alternative">
          {SUBTITLE}
        </Text>
      </View>
    </View>
  );
}
