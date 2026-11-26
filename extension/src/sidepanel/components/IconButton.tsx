import { Icon, type IconComponent } from "@promise9/ui/icon/Icon";

export interface IconButtonProps {
  iconNode: IconComponent;
  label: string;
  onClick: () => void;
}

/** 시안 `Icon Button` — 40 원형 gray-700 + 아이콘 24. Hover·Pressed 는 gray-600, Pressed 는 scale(1.1)(누를 때 100ms · 뗄 때 120ms). */
export function IconButton({ iconNode, label, onClick }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gray-700 transition-transform duration-[120ms] ease-out hover:bg-gray-600 active:scale-110 active:bg-gray-600 active:duration-100"
    >
      <Icon iconNode={iconNode} size={24} className="text-icon-strong" />
    </button>
  );
}
