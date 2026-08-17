import {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";

import { useHeaderHeight } from "./Header";
import { useHeaderHiddenOffset } from "./HeaderScrollProvider";
import { accumulateHiddenOffset } from "./header.scroll";

/**
 * 헤더를 스크롤에 연동하려는 화면의 스크롤러(Animated.ScrollView 등)에 onScroll 로 넘긴다.
 * scope 는 해당 화면 Header 의 scrollScope 와 같은 값이어야 한다.
 */
export function useHeaderAwareScrollHandler(scope: string) {
  const hiddenOffset = useHeaderHiddenOffset(scope);
  const headerHeight = useHeaderHeight();
  const previousY = useSharedValue(0);

  return useAnimatedScrollHandler({
    onScroll: (event) => {
      if (!hiddenOffset) return;
      const y = event.contentOffset.y;
      const delta = y - previousY.value;
      previousY.value = y;
      // iOS 상단 bounce 구간에서는 항상 완전 표시로 되돌린다.
      if (y <= 0) {
        hiddenOffset.value = 0;
        return;
      }
      hiddenOffset.value = accumulateHiddenOffset(
        hiddenOffset.value,
        delta,
        headerHeight,
      );
    },
  });
}
