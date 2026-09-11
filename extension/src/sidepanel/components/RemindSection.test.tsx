import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { daysFromToday } from "@/lib/remind";

import { RemindSection } from "./RemindSection";

const NOW = new Date(2026, 7, 14, 15, 30);

function renderSection(value: Date | null, onChange = vi.fn()) {
  render(
    <RemindSection
      value={value}
      now={NOW}
      onChange={onChange}
      onPickDate={vi.fn()}
      onPickTime={vi.fn()}
    />,
  );

  return onChange;
}

describe("RemindSection 랜덤 날짜", () => {
  it("주사위를 누르면 1~180일 범위 날짜로 바꾼다", async () => {
    const user = userEvent.setup();
    const onChange = renderSection(new Date(2026, 7, 15, 21, 45));

    await user.click(screen.getByRole("button", { name: "랜덤 날짜" }));

    const [next] = onChange.mock.lastCall as [Date];
    const days = daysFromToday(next, NOW);
    expect(days).toBeGreaterThanOrEqual(1);
    expect(days).toBeLessThanOrEqual(180);
    // 시각은 사용자가 고른 값을 지킨다 — 웹과 같은 정책.
    expect(next.getHours()).toBe(21);
    expect(next.getMinutes()).toBe(45);
  });

  it("리마인드를 끈 상태면 주사위도 없다", () => {
    renderSection(null);

    expect(screen.queryByRole("button", { name: "랜덤 날짜" })).toBeNull();
  });
});
