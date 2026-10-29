import { useSafeAreaInsets } from "react-native-safe-area-context";

// 시안의 56 은 아이폰 홈 인디케이터(34) 위 22 — safe-area 에 더해 기기마다 같은 간격을 남긴다.
const SCREEN_BOTTOM_GAP = 22;

/** 탭바 없는 화면·바텀시트의 스크롤 끝 여백. */
export function useScreenBottomPadding() {
  const { bottom } = useSafeAreaInsets();
  return bottom + SCREEN_BOTTOM_GAP;
}
