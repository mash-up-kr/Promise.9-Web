import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_BAR_HEIGHT = 60;
const TAB_BAR_MIN_BOTTOM = 20;
const GAP_ABOVE_TAB_BAR = 36;

export const getTabBarBottom = (insetBottom: number) =>
  Math.max(insetBottom, TAB_BAR_MIN_BOTTOM);

// 탭바는 콘텐츠 위에 떠 있어(absolute) 탭 화면이 스크롤 끝에 직접 비켜 줘야 한다.
export function useTabScreenBottomPadding() {
  const { bottom } = useSafeAreaInsets();
  return getTabBarBottom(bottom) + TAB_BAR_HEIGHT + GAP_ABOVE_TAB_BAR;
}
