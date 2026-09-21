import { Button } from "@promise9/ui/button/Button";
import { DiceIcon } from "@promise9/ui/icon/DiceIcon";
import {
  ReminderOffRow,
  ReminderOnCard,
} from "@promise9/ui/reminder-card/ReminderCard";
import { Toggle } from "@promise9/ui/toggle/Toggle";

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

/** 시안 `리마인드` 섹션 — 토글 + 앱과 같은 리마인드 카드(@promise9/ui). */
export function RemindSection({
  value,
  now,
  onChange,
  onPickDate,
  onPickTime,
}: RemindSectionProps) {
  return (
    <section>
      <header className="flex items-center justify-between">
        <h2 className="text-heading-3 text-text-strong">리마인드</h2>
        <Toggle
          value={value !== null}
          accessibilityLabel="리마인드"
          // 켤 때 기본값은 시안과 같이 '내일 오전 9시'.
          onChange={(next) =>
            onChange(next ? addDaysAtDefaultHour(1, now) : null)
          }
        />
      </header>

      <div className="mt-3">
        {value === null ? (
          <ReminderOffRow />
        ) : (
          <ReminderOnCard
            presets={REMIND_PRESETS}
            selectedPresetDays={matchedPresetDays(value, now)}
            onPreset={(days) => onChange(addDaysAtDefaultHour(days, now))}
            diceButton={
              <Button
                accessibilityLabel="랜덤 날짜"
                onPress={() => onChange(randomReminderDate(value, now))}
                className="h-9 items-center justify-center rounded-full bg-opacity-black-30 px-3"
              >
                <DiceIcon />
              </Button>
            }
            dateLabel={formatReminderDate(value)}
            remainingLabel={relativeDayLabel(value, now)}
            timeLabel={formatReminderTime(value)}
            onOpenDate={onPickDate}
            onOpenTime={onPickTime}
          />
        )}
      </div>
    </section>
  );
}
