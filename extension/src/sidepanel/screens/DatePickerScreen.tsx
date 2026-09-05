import clsx from "clsx";
import { useState } from "react";

import { withDate } from "@/lib/remind";
import { ActionButton } from "@/sidepanel/components/ActionButton";
import { WheelColumn, WheelPicker } from "@/sidepanel/components/WheelPicker";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;
/** 연 휠에 보여줄 범위 — 리마인드는 미래만 고르므로 올해부터 앞으로만 있으면 된다. */
const YEAR_RANGE = 5;
const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);

export interface DatePickerScreenProps {
  value: Date;
  /** 오늘. 이 날 이전은 고를 수 없다(서버가 미래 시각만 받는다). */
  today: Date;
  onCancel: () => void;
  onConfirm: (value: Date) => void;
}

/** 시안 `chrome-extension / date picker` + `date picker-month`. */
export function DatePickerScreen({
  value,
  today,
  onCancel,
  onConfirm,
}: DatePickerScreenProps) {
  const [selected, setSelected] = useState(value);
  // 보고 있는 달(선택과 별개 — 화살표로 넘겨도 선택은 그대로다).
  const [visible, setVisible] = useState({
    year: value.getFullYear(),
    month: value.getMonth() + 1,
  });
  // 헤더의 "2026년 8월 ˅" 를 누르면 연·월 휠로 바뀐다(시안 date picker-month).
  const [isPickingMonth, setIsPickingMonth] = useState(false);

  const years = Array.from(
    { length: YEAR_RANGE },
    (_, index) => today.getFullYear() + index,
  );

  const shiftMonth = (delta: number) => {
    const shifted = new Date(visible.year, visible.month - 1 + delta, 1);
    setVisible({
      year: shifted.getFullYear(),
      month: shifted.getMonth() + 1,
    });
  };

  return (
    <div className="flex h-full flex-col justify-center px-4 py-6">
      <div className="mx-auto w-full max-w-100">
        <h1 className="text-center text-heading-3 text-text-strong">
          날짜 선택
        </h1>

        <header className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsPickingMonth((previous) => !previous)}
            aria-expanded={isPickingMonth}
            className="flex items-center gap-1 text-heading-3-medium text-text-strong"
          >
            {visible.year}년 {visible.month}월
            <Chevron direction={isPickingMonth ? "up" : "down"} />
          </button>

          {!isPickingMonth && (
            <div className="flex gap-1">
              <IconButton label="이전 달" onClick={() => shiftMonth(-1)}>
                <Chevron direction="left" />
              </IconButton>
              <IconButton label="다음 달" onClick={() => shiftMonth(1)}>
                <Chevron direction="right" />
              </IconButton>
            </div>
          )}
        </header>

        {isPickingMonth ? (
          <div className="mt-8">
            <WheelPicker>
              <WheelColumn
                label="연"
                options={years}
                value={visible.year}
                onChange={(year) => setVisible((prev) => ({ ...prev, year }))}
                format={(year) => `${year}년`}
              />
              <WheelColumn
                label="월"
                options={MONTHS}
                value={visible.month}
                onChange={(month) => setVisible((prev) => ({ ...prev, month }))}
                format={(month) => `${month}월`}
              />
            </WheelPicker>
          </div>
        ) : (
          <MonthGrid
            year={visible.year}
            month={visible.month}
            today={today}
            selected={selected}
            onSelect={(day) =>
              setSelected(withDate(selected, visible.year, visible.month, day))
            }
          />
        )}

        <div className="mt-6 flex gap-2">
          <ActionButton variant="secondary" onClick={onCancel}>
            취소
          </ActionButton>
          <ActionButton onClick={() => onConfirm(selected)}>확인</ActionButton>
        </div>
      </div>
    </div>
  );
}

interface MonthGridProps {
  year: number;
  month: number;
  today: Date;
  selected: Date;
  onSelect: (day: number) => void;
}

function MonthGrid({ year, month, today, selected, onSelect }: MonthGridProps) {
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  // 0일을 요청하면 이전 달의 마지막 날 = 이번 달 일수.
  const dayCount = new Date(year, month, 0).getDate();

  const isSameMonth = (date: Date) =>
    date.getFullYear() === year && date.getMonth() + 1 === month;

  return (
    <div className="mt-4">
      <div className="grid grid-cols-7">
        {WEEKDAYS.map((weekday) => (
          <div
            key={weekday}
            className="flex h-8 items-center justify-center text-body-3 text-text-assistive"
          >
            {weekday}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {/* 1일이 시작하는 요일까지 빈 칸을 채운다. */}
        {Array.from({ length: firstWeekday }, (_, index) => (
          <div key={`blank-${index + 1}`} />
        ))}

        {Array.from({ length: dayCount }, (_, index) => index + 1).map(
          (day) => {
            const date = new Date(year, month - 1, day);
            // 지난 날짜는 고를 수 없다 — 서버가 미래 시각만 받는다.
            const disabled =
              date.getTime() <
              new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate(),
              ).getTime();
            const isToday =
              isSameMonth(today) && today.getDate() === day && !disabled;
            const isSelected =
              isSameMonth(selected) && selected.getDate() === day;

            return (
              <button
                key={day}
                type="button"
                disabled={disabled}
                aria-pressed={isSelected}
                onClick={() => onSelect(day)}
                className={clsx(
                  "relative mx-auto flex h-9 w-11 items-center justify-center rounded-full text-body-1",
                  disabled && "text-text-assistive/40",
                  !disabled &&
                    !isSelected &&
                    "text-text-normal hover:bg-state-hover",
                  isSelected &&
                    "bg-action-primary font-semibold text-text-inverse",
                )}
              >
                {day}
                {/* 오늘 표시 — 시안은 날짜 아래 작은 점이다. */}
                {isToday && !isSelected ? (
                  <span className="absolute bottom-1 size-1 rounded-full bg-action-primary" />
                ) : null}
              </button>
            );
          },
        )}
      </div>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-8 items-center justify-center rounded-full text-icon-normal hover:bg-state-hover"
    >
      {children}
    </button>
  );
}

const ROTATION = {
  down: "rotate-0",
  up: "rotate-180",
  left: "rotate-90",
  right: "-rotate-90",
} as const;

function Chevron({ direction }: { direction: keyof typeof ROTATION }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className={ROTATION[direction]}
    >
      <path
        d="m4 6 4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
