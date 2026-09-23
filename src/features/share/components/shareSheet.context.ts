import { createContext, useContext } from "react";

// 공유 시트 닫기 — 플랫폼별 ShareSheet(iOS 경량 · Android gorhom)가 같은 계약으로 제공한다.
export const ShareSheetDismissContext = createContext<(() => void) | null>(
  null,
);

/** 퇴장 애니메이션 후 익스텐션을 닫는다. ShareSheet 자손에서만 호출 가능. */
export function useShareSheetDismiss() {
  const dismiss = useContext(ShareSheetDismissContext);
  if (!dismiss) {
    throw new Error("useShareSheetDismiss 는 ShareSheet 안에서만 쓸 수 있다.");
  }
  return dismiss;
}
