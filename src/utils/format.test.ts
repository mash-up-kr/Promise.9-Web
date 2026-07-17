import { formatCalendarDate, formatRelativeDate } from "./format";

// 링크 저장일 표시 정책 (홈·검색 공통). base 는 조회 시각.
describe("formatRelativeDate", () => {
  const base = new Date("2026-07-14T10:00:00");

  test("저장 당일이면 '오늘'", () => {
    expect(formatRelativeDate("2026-07-14T00:30:00", base)).toBe("오늘");
    // 시각이 지나도 같은 날이면 '오늘'
    expect(formatRelativeDate("2026-07-14T23:59:00", base)).toBe("오늘");
  });

  test("저장 후 1일이면 '어제'", () => {
    expect(formatRelativeDate("2026-07-13T23:50:00", base)).toBe("어제");
  });

  test("저장 후 2~6일이면 'N일 전'", () => {
    expect(formatRelativeDate("2026-07-12T10:00:00", base)).toBe("2일 전");
    expect(formatRelativeDate("2026-07-08T10:00:00", base)).toBe("6일 전");
  });

  test("저장 후 7~13일이면 '1주 전'", () => {
    expect(formatRelativeDate("2026-07-07T10:00:00", base)).toBe("1주 전");
    expect(formatRelativeDate("2026-07-01T10:00:00", base)).toBe("1주 전");
  });

  test("저장 후 14~20일이면 '2주 전'", () => {
    expect(formatRelativeDate("2026-06-30T10:00:00", base)).toBe("2주 전");
    expect(formatRelativeDate("2026-06-24T10:00:00", base)).toBe("2주 전");
  });

  test("저장 후 21~29일이면 '3주 전'", () => {
    expect(formatRelativeDate("2026-06-23T10:00:00", base)).toBe("3주 전");
    expect(formatRelativeDate("2026-06-15T10:00:00", base)).toBe("3주 전");
  });

  test("저장 후 30일 이상이면 YYYY.MM.DD 절대 날짜", () => {
    expect(formatRelativeDate("2026-06-14T10:00:00", base)).toBe("2026.06.14");
    expect(formatRelativeDate("2026-05-28T10:00:00", base)).toBe("2026.05.28");
  });
});

// link-detail 상단의 "출처 · 저장일" 표시 — 항상 절대 날짜(YYYY.MM.DD), 상대 표현 없음.
describe("formatCalendarDate", () => {
  test("ISO 8601 문자열을 YYYY.MM.DD 로 바꾼다", () => {
    expect(formatCalendarDate("2026-06-19T00:00:00.000Z")).toBe("2026.06.19");
  });

  test("UTC 자정 시각도 로컬 타임존에 따라 날짜가 밀리지 않는다", () => {
    expect(formatCalendarDate("2026-01-01T00:00:00.000Z")).toBe("2026.01.01");
    expect(formatCalendarDate("2026-12-31T23:59:59.999Z")).toBe("2026.12.31");
  });
});
