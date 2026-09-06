import { describe, expect, it } from "vitest";

import {
  addDaysAtDefaultHour,
  daysFromToday,
  formatReminderDate,
  formatReminderTime,
  isPast,
  matchedPresetDays,
  REMIND_PRESETS,
  relativeDayLabel,
  toReminderAt,
  withDate,
  withTime,
} from "./remind";

// 2026-08-14(금) 15:30 을 "지금" 으로 두고 검증한다.
const NOW = new Date(2026, 7, 14, 15, 30);

describe("addDaysAtDefaultHour", () => {
  it("N일 뒤 오전 9시를 만든다", () => {
    // 시안의 리마인드 기본 시각이 오전 9:00 이다.
    expect(addDaysAtDefaultHour(1, NOW)).toEqual(new Date(2026, 7, 15, 9, 0));
    expect(addDaysAtDefaultHour(14, NOW)).toEqual(new Date(2026, 7, 28, 9, 0));
  });

  it("월을 넘어가도 맞는다", () => {
    expect(addDaysAtDefaultHour(20, NOW)).toEqual(new Date(2026, 8, 3, 9, 0));
  });
});

describe("REMIND_PRESETS", () => {
  it("시안의 네 가지 프리셋을 갖는다", () => {
    expect(REMIND_PRESETS.map((preset) => preset.label)).toEqual([
      "내일",
      "3일 후",
      "7일 후",
      "14일 후",
    ]);
  });
});

describe("matchedPresetDays", () => {
  it("프리셋과 같은 값이면 그 프리셋을 알려준다", () => {
    expect(matchedPresetDays(addDaysAtDefaultHour(3, NOW), NOW)).toBe(3);
  });

  it("시각이 기본(9시)과 다르면 프리셋이 아니다", () => {
    const custom = withTime(addDaysAtDefaultHour(3, NOW), 14, 30);

    expect(matchedPresetDays(custom, NOW)).toBeNull();
  });

  it("프리셋에 없는 간격이면 프리셋이 아니다", () => {
    expect(matchedPresetDays(addDaysAtDefaultHour(5, NOW), NOW)).toBeNull();
  });
});

describe("daysFromToday · relativeDayLabel", () => {
  it("날짜 차이는 시각과 무관하게 달력 기준으로 센다", () => {
    // 오늘 15:30 기준으로 내일 09:00 은 24시간이 안 되지만 "1일 후" 다.
    expect(daysFromToday(new Date(2026, 7, 15, 9, 0), NOW)).toBe(1);
    expect(daysFromToday(new Date(2026, 7, 14, 23, 59), NOW)).toBe(0);
  });

  it("오늘이면 '오늘', 아니면 'N일 후'", () => {
    expect(relativeDayLabel(new Date(2026, 7, 14, 18, 0), NOW)).toBe("오늘");
    expect(relativeDayLabel(new Date(2026, 7, 15, 9, 0), NOW)).toBe("1일 후");
    expect(relativeDayLabel(new Date(2026, 7, 28, 9, 0), NOW)).toBe("14일 후");
  });
});

describe("formatReminderDate", () => {
  it("시안 형식으로 적는다", () => {
    expect(formatReminderDate(new Date(2026, 7, 15, 9, 0))).toBe(
      "2026. 8. 15. 토요일",
    );
  });
});

describe("formatReminderTime", () => {
  it("오전·오후로 적고 분은 두 자리다", () => {
    expect(formatReminderTime(new Date(2026, 7, 15, 9, 0))).toBe("오전 9:00");
    expect(formatReminderTime(new Date(2026, 7, 15, 14, 5))).toBe("오후 2:05");
  });

  it("자정과 정오를 12시로 적는다", () => {
    expect(formatReminderTime(new Date(2026, 7, 15, 0, 30))).toBe("오전 12:30");
    expect(formatReminderTime(new Date(2026, 7, 15, 12, 0))).toBe("오후 12:00");
  });
});

describe("withDate · withTime", () => {
  it("날짜만 바꾸고 시각은 지킨다", () => {
    // withDate 의 month 는 1~12 (Date 생성자의 0~11 과 다르다).
    const changed = withDate(new Date(2026, 7, 15, 9, 0), 2026, 9, 3);

    expect(changed).toEqual(new Date(2026, 8, 3, 9, 0));
  });

  it("시각만 바꾸고 날짜는 지킨다", () => {
    const changed = withTime(new Date(2026, 7, 15, 9, 0), 21, 45);

    expect(changed).toEqual(new Date(2026, 7, 15, 21, 45));
  });
});

describe("isPast", () => {
  it("지난 시각을 가려낸다", () => {
    // 서버가 미래 시각만 받으므로(reminderAt refine) 저장 전에 여기서 막는다.
    expect(isPast(new Date(2026, 7, 14, 15, 29), NOW)).toBe(true);
    expect(isPast(new Date(2026, 7, 14, 15, 31), NOW)).toBe(false);
  });
});

describe("toReminderAt", () => {
  it("서버가 받는 ISO 8601 문자열로 바꾼다", () => {
    const at = new Date(2026, 7, 15, 9, 0);

    // 로컬 시각을 그대로 보내면 서버가 타임존을 알 수 없다 — UTC(Z) 로 변환해 보낸다.
    expect(toReminderAt(at)).toBe(at.toISOString());
    expect(toReminderAt(at)).toMatch(/Z$/);
  });
});
