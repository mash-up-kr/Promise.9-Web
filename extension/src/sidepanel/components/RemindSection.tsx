import clsx from "clsx";

import {
  addDaysAtDefaultHour,
  formatReminderDate,
  formatReminderTime,
  matchedPresetDays,
  REMIND_PRESETS,
  relativeDayLabel,
} from "@/lib/remind";

export interface RemindSectionProps {
  /** null 이면 리마인드를 끈 상태. */
  value: Date | null;
  now: Date;
  onChange: (value: Date | null) => void;
  onPickDate: () => void;
  onPickTime: () => void;
}

/** 시안 `리마인드` 섹션 — 토글 + 프리셋 칩 + 날짜·시간 행. */
export function RemindSection({
  value,
  now,
  onChange,
  onPickDate,
  onPickTime,
}: RemindSectionProps) {
  const enabled = value !== null;
  const presetDays = value ? matchedPresetDays(value, now) : null;

  return (
    <section>
      <header className="flex items-center justify-between">
        <h2 className="text-heading-3 text-text-strong">리마인드</h2>
        <Toggle
          checked={enabled}
          label="리마인드"
          // 켤 때 기본값은 시안과 같이 '내일 오전 9시'.
          onChange={(next) =>
            onChange(next ? addDaysAtDefaultHour(1, now) : null)
          }
        />
      </header>

      <div className="mt-3 rounded-2xl bg-background-list p-4">
        <p className="flex items-center gap-1.5 text-body-2-normal text-text-alternative">
          <BellIcon />
          {enabled ? "언제 알려드릴까요?" : "잊지 않도록 다시 알려드려요"}
        </p>

        {value ? (
          <>
            <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
              {REMIND_PRESETS.map((preset) => (
                <button
                  key={preset.days}
                  type="button"
                  aria-pressed={presetDays === preset.days}
                  onClick={() =>
                    onChange(addDaysAtDefaultHour(preset.days, now))
                  }
                  className={clsx(
                    "h-9 shrink-0 rounded-full px-3.5 text-body-3",
                    presetDays === preset.days
                      ? "bg-action-inverse text-text-inverse"
                      : "bg-background-list-selected text-text-alternative",
                  )}
                >
                  {preset.label}
                </button>
              ))}
              <button
                type="button"
                aria-label="날짜 직접 선택"
                aria-pressed={presetDays === null}
                onClick={onPickDate}
                className={clsx(
                  "flex size-9 shrink-0 items-center justify-center rounded-full",
                  presetDays === null
                    ? "bg-action-inverse text-text-inverse"
                    : "bg-background-list-selected text-icon-normal",
                )}
              >
                <CalendarPlusIcon />
              </button>
            </div>

            <hr className="my-3 border-border-divider" />

            <DetailRow
              icon={<CalendarIcon />}
              label={formatReminderDate(value)}
              trailing={relativeDayLabel(value, now)}
              onClick={onPickDate}
            />
            <DetailRow
              icon={<ClockIcon />}
              label={formatReminderTime(value)}
              onClick={onPickTime}
            />
          </>
        ) : null}
      </div>
    </section>
  );
}

interface DetailRowProps {
  icon: React.ReactNode;
  label: string;
  trailing?: string;
  onClick: () => void;
}

function DetailRow({ icon, label, trailing, onClick }: DetailRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 py-2 text-body-2-normal text-text-normal"
    >
      <span className="text-icon-alternative">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {trailing ? (
        <span className="text-body-3 text-text-assistive">{trailing}</span>
      ) : null}
      <ChevronRight />
    </button>
  );
}

interface ToggleProps {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}

function Toggle({ checked, label, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={clsx(
        "flex h-6 w-11 items-center rounded-full p-0.5 transition-colors",
        checked ? "bg-action-inverse" : "bg-background-list-selected",
      )}
    >
      <span
        className={clsx(
          "size-5 rounded-full bg-opacity-white-100 transition-transform",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M8 2a4 4 0 0 0-4 4v2.5L3 11h10l-1-2.5V6a4 4 0 0 0-4-4Zm0 12a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect
        x="2"
        y="3.5"
        width="12"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M2 6.5h12M5.5 2v3M10.5 2v3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CalendarPlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect
        x="2.5"
        y="4"
        width="13"
        height="11"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M2.5 7.5h13M9 9.5v4M7 11.5h4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M8 4.8V8l2.2 1.6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className="text-icon-assistive"
    >
      <path
        d="m6 4 4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
