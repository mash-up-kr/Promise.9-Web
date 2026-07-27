import type { ReactNode } from "react";

export interface SheetShellProps {
  children: ReactNode;
  /** 시트 dismiss(백드롭·pan-down) 콜백. 전 OS gorhom 시트가 사용한다. */
  onClose: () => void;
}

export interface SheetScreenProps {
  children: ReactNode;
  /** 생략 시 router.back() 으로 닫는다. */
  onClose?: () => void;
}
