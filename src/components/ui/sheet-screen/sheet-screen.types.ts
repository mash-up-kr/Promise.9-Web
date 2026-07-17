import type { ReactNode } from "react";

export interface SheetShellProps {
  children: ReactNode;
  /** 웹 바텀시트 dismiss(백드롭·드래그) 콜백. 네이티브는 OS formSheet 가 처리해 미사용. */
  onClose: () => void;
}

export interface SheetScreenProps {
  children: ReactNode;
  /** 생략 시 router.back() 으로 닫는다. */
  onClose?: () => void;
}
