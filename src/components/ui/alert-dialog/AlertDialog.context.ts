import { createContext, useContext } from "react";

export interface AlertDialogContextValue {
  close: () => void;
  closeOnOverlayClick: boolean;
}

const AlertDialogContext = createContext<AlertDialogContextValue | null>(null);

export const AlertDialogProvider = AlertDialogContext.Provider;

export function useAlertDialogContext(): AlertDialogContextValue {
  const ctx = useContext(AlertDialogContext);
  if (!ctx) {
    throw new Error(
      "AlertDialog 하위 컴포넌트는 <AlertDialog> 안에서만 사용할 수 있습니다.",
    );
  }
  return ctx;
}
