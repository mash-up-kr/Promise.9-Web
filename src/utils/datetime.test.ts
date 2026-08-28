import {
  getCalendarWeeks,
  getTomorrowDate,
  roundUpToQuarter,
  to12Hour,
  to24Hour,
} from "./datetime";

it("내일은 자정 기준 — 23:55 에도 다음 날", () => {
  expect(getTomorrowDate(new Date("2026-08-26T23:55:00"))).toBe("2026-08-27");
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

it("캘린더 주 배열 — 2026-08 은 토요일 1일 시작, 6주", () => {
  const weeks = getCalendarWeeks("2026-08");
  expect(weeks[0]).toEqual([null, null, null, null, null, null, "2026-08-01"]);
  expect(weeks.at(-1)?.filter(Boolean).at(-1)).toBe("2026-08-31");
  expect(weeks.every((w) => w.length === 7)).toBe(true);
});
