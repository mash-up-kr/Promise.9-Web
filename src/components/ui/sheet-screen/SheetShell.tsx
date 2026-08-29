import { BottomSheet } from "@/components/ui/bottom-sheet/BottomSheet";

import type { SheetShellProps } from "./sheet-screen.types";

// 전 OS 공통 시트 껍데기 — gorhom BottomSheet 가 크롬(backdrop·그래버·detent·키보드)을 그린다.
export function SheetShell({
  children,
  onClose,
  backdropPressBehavior,
  isLocked,
}: SheetShellProps) {
  return (
    <BottomSheet
      onClose={onClose}
      backdropPressBehavior={backdropPressBehavior}
      isLocked={isLocked}
    >
      {children}
    </BottomSheet>
  );
}
