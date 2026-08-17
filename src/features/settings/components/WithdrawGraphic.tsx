import { Image } from "react-native";

// Figma `setting/withdraw` 폴더+Star/Chain 버블 일러스트(200×200, 투명 PNG).
export function WithdrawGraphic() {
  return (
    <Image
      // 표시 크기와 동일한 1x 에셋 — 필요 시 @2x/@3x 를 같은 폴더에 추가하면 Metro 가 자동 선택.
      source={require("../../../../assets/images/setting-folder-image.png")}
      accessibilityRole="image"
      accessibilityLabel="회원 탈퇴 안내 그래픽"
      resizeMode="contain"
      style={{ width: 200, height: 200 }}
    />
  );
}
