import { dayjs } from "@/lib/dayjs";

/** 도메인과 무관한 날짜·시간 계산 모음 — 리마인드 등 화면 정책은 features 쪽 유틸이 갖는다. */

export type Meridiem = "오전" | "오후";

const DATE_FORMAT = "YYYY-MM-DD";
const QUARTER = 15;

export function getTomorrowDate(base: Date = new Date()): string {
  return dayjs(base).add(1, "day").format(DATE_FORMAT);
}

export function addDaysDate(days: number, base: Date = new Date()): string {
  return dayjs(base).add(days, "day").format(DATE_FORMAT);
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

/** 일요일 시작 7칸 주 배열 — 달력 그리드용. 비는 칸은 null. */
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
