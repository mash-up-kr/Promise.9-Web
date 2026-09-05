import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary";

export interface ActionButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "bg-action-inverse text-text-inverse",
  secondary: "bg-background-list-selected text-text-normal",
};

/** 시안 `Action Button` — 높이 44, 라운드 풀, 가로 꽉 참. */
export function ActionButton({
  variant = "primary",
  className,
  type = "button",
  ...props
}: ActionButtonProps) {
  return (
    <button
      type={type}
      className={clsx(
        "h-11 w-full rounded-full text-heading-3 transition-opacity",
        "disabled:opacity-40",
        "not-disabled:hover:opacity-90 not-disabled:active:opacity-80",
        VARIANT_CLASS[variant],
        className,
      )}
      {...props}
    />
  );
}
