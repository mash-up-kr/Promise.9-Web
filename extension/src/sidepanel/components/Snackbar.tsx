import { type ReactNode, useEffect } from "react";

export interface SnackbarProps {
  icon: ReactNode;
  message: string;
  onDismiss: () => void;
}

/** 시안 `Snackbar` — 화면 아래 28 위에 떠서 2.5초 뒤 스스로 닫힌다. */
export function Snackbar({ icon, message, onDismiss }: SnackbarProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 2500);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      role="status"
      className="fixed inset-x-5 bottom-7 flex items-center gap-3 rounded-2xl bg-gray-600 px-4 py-3 shadow-[0px_8px_24px_0px_rgba(0,0,0,0.35)]"
    >
      <span
        aria-hidden
        className="flex size-5 shrink-0 items-center justify-center"
      >
        {icon}
      </span>
      <p className="text-body-2-reading text-text-normal">{message}</p>
    </div>
  );
}
