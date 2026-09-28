import { REMINDER_PRESETS } from "./reminder.constants";

describe("REMINDER_PRESETS", () => {
  it("시안의 네 가지 프리셋을 갖는다", () => {
    expect(REMINDER_PRESETS.map((preset) => preset.label)).toEqual([
      "내일",
      "3일 후",
      "7일 후",
      "14일 후",
    ]);
    expect(REMINDER_PRESETS.map((preset) => preset.days)).toEqual([
      1, 3, 7, 14,
    ]);
  });
});
