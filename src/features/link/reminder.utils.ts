import { dayjs } from "@/lib/dayjs";
import { getTomorrowDate, to12Hour } from "@/utils/datetime";

/** 리마인드 도메인 정책 유틸 — 범용 날짜 계산은 `@/utils/datetime` 이 갖는다. */

export interface ReminderValue {
  date: string;
  hour: number;
  minute: number;
}

const DATE_FORMAT = "YYYY-MM-DD";
export const REMINDER_MAX_MONTHS = 6;
const RANDOM_MAX_DAYS = 180;

export function getReminderDateRange(base: Date = new Date()): {
  min: string;
  max: string;
} {
  return {
    min: getTomorrowDate(base),
    max: dayjs(base).add(REMINDER_MAX_MONTHS, "month").format(DATE_FORMAT),
  };
}

export function getRandomReminderDays(
  rand: () => number = Math.random,
): number {
  return Math.floor(rand() * RANDOM_MAX_DAYS) + 1;
}

// 남은 기간 표기 — 7·30 으로 정확히 나눠떨어지면 근사가 아니므로 '약' 을 붙이지 않는다(시안 정책).
export function formatRemainingPeriod(
  target: string,
  base: Date = new Date(),
): string {
  const days = dayjs(target)
    .startOf("day")
    .diff(dayjs(base).startOf("day"), "day");
  if (days <= 13) return `${days}일 후`;
  if (days <= 59) {
    const weeks = Math.round(days / 7);
    return days % 7 === 0 ? `${weeks}주 후` : `약 ${weeks}주 후`;
  }
  const months = Math.round(days / 30);
  return days % 30 === 0 ? `${months}개월 후` : `약 ${months}개월 후`;
}

export function formatReminderDate(date: string): string {
  return dayjs(date).format("YYYY. M. D. dddd");
}

export function formatReminderTime(hour: number, minute: number): string {
  const { meridiem, hour12 } = to12Hour(hour);
  return `${meridiem} ${hour12}:${String(minute).padStart(2, "0")}`;
}

export function toReminderAtIso(value: ReminderValue): string {
  const time = `${String(value.hour).padStart(2, "0")}:${String(value.minute).padStart(2, "0")}`;
  return dayjs(`${value.date} ${time}`).format("YYYY-MM-DDTHH:mm:ssZ");
}

// 서버가 "현재보다 이후"만 허용하므로 같은 시각도 과거로 취급한다.
export function isPastReminder(
  value: ReminderValue,
  base: Date = new Date(),
): boolean {
  const time = `${String(value.hour).padStart(2, "0")}:${String(value.minute).padStart(2, "0")}`;
  return !dayjs(`${value.date} ${time}`).isAfter(dayjs(base));
}
