import {
  formatRemainingPeriod,
  getCalendarWeeks,
  getRandomReminderDays,
  getReminderDateRange,
  getTomorrowDate,
  isPastReminder,
  roundUpToQuarter,
  to12Hour,
  to24Hour,
  toReminderAtIso,
} from "./reminder.utils";

const BASE = new Date("2026-08-26T14:32:00"); // 로컬 기준 수요일

describe("formatRemainingPeriod", () => {
  const cases: [number, string][] = [
    [1, "1일 후"],
    [5, "5일 후"],
    [13, "13일 후"],
    [14, "2주 후"],
    [18, "약 3주 후"],
    [21, "3주 후"],
    [25, "약 4주 후"],
    [59, "약 8주 후"],
    [60, "2개월 후"],
    [75, "약 3개월 후"],
    [140, "약 5개월 후"],
    [180, "6개월 후"],
  ];
  it.each(cases)("%d일 → %s", (days, expected) => {
    const target = new Date(BASE);
    target.setDate(target.getDate() + days);
    const iso = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}-${String(target.getDate()).padStart(2, "0")}`;
    expect(formatRemainingPeriod(iso, BASE)).toBe(expected);
  });
});

it("내일은 자정 기준 — 23:55 에도 다음 날", () => {
  expect(getTomorrowDate(new Date("2026-08-26T23:55:00"))).toBe("2026-08-27");
});

it("범위는 내일부터 6개월 후까지", () => {
  expect(getReminderDateRange(BASE)).toEqual({
    min: "2026-08-27",
    max: "2027-02-26",
  });
});

it("랜덤은 1~180일", () => {
  expect(getRandomReminderDays(() => 0)).toBe(1);
  expect(getRandomReminderDays(() => 0.999999)).toBe(180);
});

it("현재 시간을 다음 15분 격자로 올림", () => {
  expect(roundUpToQuarter(new Date("2026-08-26T14:32:00"))).toEqual({
    hour: 14,
    minute: 45,
  });
  expect(roundUpToQuarter(new Date("2026-08-26T14:45:00"))).toEqual({
    hour: 14,
    minute: 45,
  });
  expect(roundUpToQuarter(new Date("2026-08-26T23:50:00"))).toEqual({
    hour: 0,
    minute: 0,
  });
});

it("12/24시 변환", () => {
  expect(to12Hour(0)).toEqual({ meridiem: "오전", hour12: 12 });
  expect(to12Hour(12)).toEqual({ meridiem: "오후", hour12: 12 });
  expect(to12Hour(15)).toEqual({ meridiem: "오후", hour12: 3 });
  expect(to24Hour("오전", 12)).toBe(0);
  expect(to24Hour("오후", 3)).toBe(15);
});

it("reminderAt 은 로컬 오프셋 포함 ISO", () => {
  expect(toReminderAtIso({ date: "2026-08-27", hour: 9, minute: 0 })).toMatch(
    /^2026-08-27T09:00:00[+-]\d{2}:\d{2}$/,
  );
});

it("과거 시각 판정 — 같은 시각도 과거로 본다(서버가 미래만 허용)", () => {
  expect(
    isPastReminder({ date: "2026-08-26", hour: 14, minute: 0 }, BASE),
  ).toBe(true);
  expect(
    isPastReminder({ date: "2026-08-26", hour: 14, minute: 32 }, BASE),
  ).toBe(true);
  expect(isPastReminder({ date: "2026-08-27", hour: 0, minute: 0 }, BASE)).toBe(
    false,
  );
});

it("캘린더 주 배열 — 2026-08 은 토요일 1일 시작, 6주", () => {
  const weeks = getCalendarWeeks("2026-08");
  expect(weeks[0]).toEqual([null, null, null, null, null, null, "2026-08-01"]);
  expect(weeks.at(-1)?.filter(Boolean).at(-1)).toBe("2026-08-31");
  expect(weeks.every((w) => w.length === 7)).toBe(true);
});
