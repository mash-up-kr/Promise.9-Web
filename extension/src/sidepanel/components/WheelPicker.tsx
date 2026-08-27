import clsx from "clsx";
import { type ReactNode, useEffect, useRef } from "react";

/** 항목 한 칸 높이(px). 스크롤 위치 ↔ 선택 인덱스 환산에 쓰므로 CSS(h-10)와 같은 값이어야 한다. */
const ITEM_HEIGHT = 40;

/**
 * 시안의 휠 선택기 — 가운데 한 행이 선택값이고 위아래로 이웃 값이 흐리게 보인다.
 *
 * 실제 스크롤 + CSS scroll-snap 으로 만든다. 드래그를 직접 구현하지 않아도 관성·스냅이
 * 브라우저 기본 동작으로 나오고, 키보드·트랙패드도 그대로 동작한다.
 *
 * 열마다 값 타입이 달라서(오전/오후는 문자열, 시·분은 숫자) 배열 prop 하나로 받지 않고
 * 열을 각각 컴포넌트로 둔다 — 그래야 열별로 타입이 따로 추론된다.
 */
export function WheelPicker({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      {/* 가운데 선택 행 강조. 스크롤을 가리지 않도록 이벤트를 통과시킨다. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-10 h-10 rounded-full bg-background-list-selected"
      />
      <div className="relative flex justify-center gap-6">{children}</div>
    </div>
  );
}

export interface WheelColumnProps<T extends string | number> {
  /** 스크린리더용 이름. */
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  format?: (value: T) => string;
}

export function WheelColumn<T extends string | number>({
  label,
  options,
  value,
  onChange,
  format = String,
}: WheelColumnProps<T>) {
  const listRef = useRef<HTMLFieldSetElement>(null);
  const selectedIndex = options.indexOf(value);

  // 값이 밖에서 바뀌면(프리셋 선택 등) 그 항목이 가운데 오도록 맞춘다.
  useEffect(() => {
    const list = listRef.current;
    if (!list || selectedIndex < 0) return;

    const top = selectedIndex * ITEM_HEIGHT;
    if (Math.abs(list.scrollTop - top) > 1) list.scrollTop = top;
  }, [selectedIndex]);

  const handleScroll = () => {
    const list = listRef.current;
    if (!list) return;

    const next = options[Math.round(list.scrollTop / ITEM_HEIGHT)];
    if (next !== undefined && next !== value) onChange(next);
  };

  return (
    // fieldset = 암묵적 role="group" — 이름이 있어야 스크린리더가 "시"·"분" 을 구분해 읽는다.
    <fieldset
      ref={listRef}
      onScroll={handleScroll}
      aria-label={label}
      className="h-30 snap-y snap-mandatory overflow-y-scroll py-10 [scrollbar-width:none]"
    >
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={option === value}
          onClick={() => onChange(option)}
          className={clsx(
            "flex h-10 w-full snap-center items-center justify-center text-nowrap px-2 text-heading-3",
            option === value ? "text-text-strong" : "text-text-assistive",
          )}
        >
          {format(option)}
        </button>
      ))}
    </fieldset>
  );
}
