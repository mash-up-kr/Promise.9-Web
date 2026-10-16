import { FontDisplay, useFonts } from "expo-font";
import { useEffect } from "react";

// 네이티브는 가변 폰트의 weight 축을 못 읽어 굵기별 static 폰트를 별도 family 로 등록한다(#25).
const swap = (uri: number) => ({ uri, display: FontDisplay.SWAP });

/**
 * 앱 폰트를 등록하고 화면을 그려도 되는지 돌려준다(웹은 useAppFonts.web.ts).
 * 번들 폰트라 즉시 뜨지만, 실패해도 멈추지 않고 시스템 폰트로 진입한다.
 */
export function useAppFonts(): boolean {
  const [isLoaded, error] = useFonts({
    Pretendard: swap(require("@/assets/fonts/Pretendard-Regular.ttf")),
    "Pretendard-Medium": swap(require("@/assets/fonts/Pretendard-Medium.ttf")),
    "Pretendard-SemiBold": swap(
      require("@/assets/fonts/Pretendard-SemiBold.ttf"),
    ),
    "Pretendard-Bold": swap(require("@/assets/fonts/Pretendard-Bold.ttf")),
  });

  useEffect(() => {
    if (error) {
      console.error("[font] 폰트 로딩 실패 — 시스템 폰트로 진입", error);
    }
  }, [error]);

  return isLoaded || error !== null;
}
