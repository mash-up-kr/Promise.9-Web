import { dayjs } from "@/lib/dayjs";

export interface ReminderValue {
  date: string;
  hour: number;
  minute: number;
}

export type Meridiem = "오전" | "오후";

const DATE_FORMAT = "YYYY-MM-DD";
export const REMINDER_MAX_MONTHS = 6;
const RANDOM_MAX_DAYS = 180;
const QUARTER = 15;

export function getTomorrowDate(base: Date = new Date()): string {
  return dayjs(base).add(1, "day").format(DATE_FORMAT);
}

export function addDaysDate(days: number, base: Date = new Date()): string {
  return dayjs(base).add(days, "day").format(DATE_FORMAT);
}

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

export function roundUpToQuarter(base: Date = new Date()): {
  hour: number;
  minute: number;
} {
  const d = dayjs(base);
  const total =
    (d.hour() * 60 + Math.ceil(d.minute() / QUARTER) * QUARTER) % (24 * 60);
  return { hour: Math.floor(total / 60), minute: total % 60 };
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

export function to12Hour(hour: number): { meridiem: Meridiem; hour12: number } {
  return {
    meridiem: hour < 12 ? "오전" : "오후",
    hour12: hour % 12 === 0 ? 12 : hour % 12,
  };
}

export function to24Hour(meridiem: Meridiem, hour12: number): number {
  const base = hour12 % 12;
  return meridiem === "오후" ? base + 12 : base;
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

export function getCalendarWeeks(month: string): (string | null)[][] {
  const first = dayjs(`${month}-01`);
  const cells: (string | null)[] = [
    ...Array.from({ length: first.day() }, () => null),
    ...Array.from({ length: first.daysInMonth() }, (_, i) =>
      first.add(i, "day").format(DATE_FORMAT),
    ),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
