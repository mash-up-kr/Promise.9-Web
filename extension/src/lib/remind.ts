/** 리마인드 기본 시각 — 시안의 프리셋은 모두 오전 9시다. */
export const DEFAULT_REMIND_HOUR = 9;

/** 시안 `언제 알려드릴까요?` 프리셋 칩. */
export const REMIND_PRESETS = [
  { days: 1, label: "내일" },
  { days: 3, label: "3일 후" },
  { days: 7, label: "7일 후" },
  { days: 14, label: "14일 후" },
] as const;

/** 시안 시간 피커의 분 단위. */
export const MINUTE_STEP = 15;

const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** `days` 일 뒤 오전 9시. */
export function addDaysAtDefaultHour(days: number, now: Date): Date {
  const base = startOfDay(now);

  return new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate() + days,
    DEFAULT_REMIND_HOUR,
    0,
  );
}

/**
 * 오늘로부터 며칠 뒤인지 — 시각이 아니라 **달력 날짜** 기준으로 센다.
 *
 * 지금이 15:30 일 때 내일 09:00 은 24시간이 안 되지만 사용자에겐 "1일 후" 다.
 */
export function daysFromToday(date: Date, now: Date): number {
  return Math.round(
    (startOfDay(date).getTime() - startOfDay(now).getTime()) / MS_PER_DAY,
  );
}

export function relativeDayLabel(date: Date, now: Date): string {
  const days = daysFromToday(date, now);

  return days === 0 ? "오늘" : `${days}일 후`;
}

/** 지금 값이 어떤 프리셋과 같은지. 프리셋이 아니면 null(=직접 선택). */
export function matchedPresetDays(date: Date, now: Date): number | null {
  if (date.getHours() !== DEFAULT_REMIND_HOUR || date.getMinutes() !== 0) {
    return null;
  }

  const days = daysFromToday(date, now);

  return REMIND_PRESETS.some((preset) => preset.days === days) ? days : null;
}

/** 시안 표기: `2026. 8. 15. 토요일` */
export function formatReminderDate(date: Date): string {
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];

  return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}. ${weekday}요일`;
}

/** 시안 표기: `오전 9:00` */
export function formatReminderTime(date: Date): string {
  const hours = date.getHours();
  const meridiem = hours < 12 ? "오전" : "오후";
  // 0시·12시는 12로 적는다.
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${meridiem} ${hour12}:${minutes}`;
}

/** 시각은 두고 날짜만 교체 (month 는 1~12). */
export function withDate(
  date: Date,
  year: number,
  month: number,
  day: number,
): Date {
  return new Date(year, month - 1, day, date.getHours(), date.getMinutes());
}

/** 날짜는 두고 시각만 교체. */
export function withTime(date: Date, hours: number, minutes: number): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hours,
    minutes,
  );
}

export function isPast(date: Date, now: Date): boolean {
  return date.getTime() <= now.getTime();
}

/**
 * 서버가 받는 값으로 변환한다.
 *
 * 서버 계약은 타임존을 포함한 ISO 8601 미래 시각이다(`reminderAt`). 로컬 시각을 그대로
 * 문자열로 보내면 타임존이 빠져 서버가 다른 시점으로 해석할 수 있어 UTC(Z)로 변환한다.
 */
export function toReminderAt(date: Date): string {
  return date.toISOString();
}
