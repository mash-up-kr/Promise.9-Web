import type { ReactNode } from "react";

export interface SheetShellProps {
  children: ReactNode;
  /** 시트 dismiss(백드롭·pan-down) 콜백. 전 OS gorhom 시트가 사용한다. */
  onClose: () => void;
  /** 백드롭 탭 시 동작. "none" 이면 탭으로 닫히지 않는다. 기본 "close". */
  backdropPressBehavior?: "close" | "none";
  /** true 면 pan-down 제스처로 닫히지 않는다. 기본 false. */
  isLocked?: boolean;
}

export interface SheetScreenProps {
  children: ReactNode;
  /** 생략 시 router.back() 으로 닫는다. */
  onClose?: () => void;
  /** 스크롤 영역 앞(형제)에 고정 렌더할 헤더. */
  header?: ReactNode;
  /** 백드롭 탭 시 동작. "none" 이면 탭으로 닫히지 않는다. 기본 "close". */
  backdropPressBehavior?: "close" | "none";
  /** true 면 pan-down 제스처로 닫히지 않는다. 기본 false. */
  isLocked?: boolean;
}
