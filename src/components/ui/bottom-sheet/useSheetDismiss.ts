import { useBottomSheet } from "@gorhom/bottom-sheet";
import { useCallback } from "react";

/**
 * 시트를 애니메이션으로 닫는다 — 완전히 닫히면 BottomSheet 의 onClose(라우트 제거)가
 * 이어서 불린다. 취소·저장 버튼이 router.back() 을 직접 부르면 시트가 즉시 소멸하므로
 * 반드시 이 훅을 쓴다. BottomSheet 자손(시트 콘텐츠)에서만 호출 가능.
 */
export function useSheetDismiss() {
  const { close } = useBottomSheet();

  // onPress 가 넘기는 이벤트 객체가 close 의 animationConfigs 인자로 새지 않게 감싼다.
  return useCallback(() => {
    close();
  }, [close]);
}
