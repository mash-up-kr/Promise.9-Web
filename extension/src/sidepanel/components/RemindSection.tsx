import clsx from "clsx";

import {
  addDaysAtDefaultHour,
  formatReminderDate,
  formatReminderTime,
  matchedPresetDays,
  REMIND_PRESETS,
  randomReminderDate,
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
                aria-label="랜덤 날짜"
                onClick={() => onChange(randomReminderDate(value, now))}
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-background-list-selected text-opacity-white-60"
              >
                <DiceIcon />
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
          "size-5 rounded-full transition-transform",
          // 트랙이 켜짐=흰색(action-inverse)·꺼짐=어두움이라, 손잡이는 반대로 두어야 보인다.
          checked
            ? "translate-x-5 bg-icon-inverse"
            : "translate-x-0 bg-opacity-white-100",
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

// 웹 `DiceIcon` 과 같은 시안 에셋(Icon/Dices, 채움형 이중 주사위) — lucide 에 대응 항목이 없다.
function DiceIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <g transform="translate(1, 1.16)" fill="currentColor">
        <path d="M13.8776 2.61714V2.76067H6.79424C4.37928 2.76067 2.96772 4.13677 2.96772 6.52595V13.778H2.6701C0.892895 13.778 3.8147e-05 12.8999 3.8147e-05 11.1608V2.61714C3.8147e-05 0.878013 0.892895 1.0848e-05 2.6701 1.0848e-05H11.2075C12.9762 1.0848e-05 13.8776 0.878013 13.8776 2.61714Z" />
        <path d="M18.0017 6.52595V15.0696C18.0017 16.8087 17.1004 17.6867 15.3316 17.6867H6.79424C5.01704 17.6867 4.12417 16.8087 4.12417 15.0696V6.52595C4.12417 4.77839 5.01704 3.90882 6.79424 3.90882H15.3316C17.1004 3.90882 18.0017 4.78683 18.0017 6.52595ZM6.39458 14.217C6.39458 14.9008 6.9388 15.458 7.62757 15.458C8.30783 15.458 8.86058 14.9008 8.86058 14.217C8.86058 13.5332 8.30783 12.9929 7.62757 12.9929C6.9388 12.9929 6.39458 13.5332 6.39458 14.217ZM13.2568 14.217C13.2568 14.9008 13.8096 15.458 14.4898 15.458C15.1701 15.458 15.7313 14.9008 15.7313 14.217C15.7313 13.5332 15.1701 12.9929 14.4898 12.9929C13.8096 12.9929 13.2568 13.5332 13.2568 14.217ZM9.82145 10.7978C9.82145 11.4901 10.3742 12.0473 11.0544 12.0473C11.7347 12.0473 12.2959 11.4901 12.2959 10.7978C12.2959 10.1224 11.7347 9.58206 11.0544 9.58206C10.3742 9.58206 9.82145 10.1224 9.82145 10.7978ZM6.38608 7.38708C6.38608 8.07939 6.9388 8.6197 7.62757 8.62809C8.30783 8.64503 8.86903 8.07939 8.86903 7.38708C8.86903 6.71169 8.30783 6.16293 7.62757 6.16293C6.9388 6.16293 6.38608 6.71169 6.38608 7.38708ZM13.2483 7.38708C13.2483 8.07939 13.8096 8.6197 14.4898 8.62809C15.1701 8.64503 15.7313 8.07939 15.7313 7.38708C15.7313 6.71169 15.1701 6.16293 14.4898 6.16293C13.8096 6.16293 13.2483 6.71169 13.2483 7.38708Z" />
      </g>
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
