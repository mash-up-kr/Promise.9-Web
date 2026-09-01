import { close } from "expo-share-extension";
import { Pressable, Text, View } from "react-native";

// [스파이크] iOS Share Extension 부팅 검증용 최소 화면 — 시안 반영 전 임시.
// 익스텐션 번들 크기·부팅 리스크를 줄이기 위해 NativeWind 없이 plain style 로 그린다.
export function ShareExtension({ url }: { url?: string }) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        borderRadius: 24,
        backgroundColor: "#1a1a1a",
      }}
    >
      <Text style={{ color: "#ffffff", fontSize: 17, fontWeight: "600" }}>
        공유 수신 스파이크
      </Text>
      <Text
        style={{ color: "#a0a0a0", paddingHorizontal: 24 }}
        numberOfLines={2}
      >
        {url ?? "url 없음"}
      </Text>
      <Pressable onPress={() => close()}>
        <Text style={{ color: "#facc15", fontSize: 16 }}>닫기</Text>
      </Pressable>
    </View>
  );
}
