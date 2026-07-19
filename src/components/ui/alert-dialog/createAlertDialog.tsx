import type { ComponentType, ReactNode } from "react";
import { useCallback } from "react";

import {
  AlertDialogProvider,
  useAlertDialogContext,
} from "./AlertDialog.context";

export interface AlertDialogRootProps {
  isOpen: boolean;
  onClose: () => void;
  closeOnOverlayClick?: boolean;
  children: ReactNode;
}

interface OverlayProps {
  visible: boolean;
  onRequestClose: () => void;
  children: ReactNode;
}

interface BackdropProps {
  onPress?: () => void;
}

/**
 * gluestack 의 `createAlertDialog` 를 우리 니즈로 축약한 헤드리스 팩토리.
 * 오버레이 호스트·backdrop 같은 프리미티브를 주입받아 open 상태·컨텍스트·
 * backdrop 닫기만 결합한다 — 스타일은 전혀 알지 못한다(래퍼에서 주입).
 */
export function createAlertDialog({
  Overlay,
  Backdrop,
}: {
  Overlay: ComponentType<OverlayProps>;
  Backdrop: ComponentType<BackdropProps>;
}) {
  function AlertDialog({
    isOpen,
    onClose,
    closeOnOverlayClick = true,
    children,
  }: AlertDialogRootProps) {
    const close = useCallback(() => onClose(), [onClose]);
    return (
      <Overlay visible={isOpen} onRequestClose={close}>
        <AlertDialogProvider value={{ close, closeOnOverlayClick }}>
          {children}
        </AlertDialogProvider>
      </Overlay>
    );
  }

  function AlertDialogBackdrop() {
    const { close, closeOnOverlayClick } = useAlertDialogContext();
    return <Backdrop onPress={closeOnOverlayClick ? close : undefined} />;
  }
  AlertDialogBackdrop.displayName = "AlertDialog.Backdrop";

  AlertDialog.Backdrop = AlertDialogBackdrop;
  return AlertDialog;
}
