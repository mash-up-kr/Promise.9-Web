import {
  formatRemainingPeriod,
  getRandomReminderDays,
  getReminderDateRange,
  isPastReminder,
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
