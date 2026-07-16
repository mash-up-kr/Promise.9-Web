import { BottomSheet } from "@/components/ui/bottom-sheet/BottomSheet";

import type { SheetShellProps } from "./sheet-screen.types";

// 웹 시트 껍데기. 리퀴드 글래스로 바꾸려면 여기(웹) + SheetShell.tsx(네이티브)만 손대면
// SheetScreen 을 쓰는 모든 시트(새 폴더·링크 저장…)에 한 번에 반영된다.
export function SheetShell({ children, onClose }: SheetShellProps) {
  return <BottomSheet onClose={onClose}>{children}</BottomSheet>;
}
