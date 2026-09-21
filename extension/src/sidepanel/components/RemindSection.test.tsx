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

describe("RemindSection 앱과 같은 카드", () => {
  it("꺼진 상태: 스위치는 꺼짐이고 안내 문구를 보인다", () => {
    renderSection(null);

    expect(screen.getByRole("switch", { name: "리마인드" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
    expect(screen.getByText("잊지 않도록 다시 알려드려요")).toBeInTheDocument();
  });

  it("스위치를 켜면 내일 오전 9시로 onChange 를 부른다", async () => {
    const user = userEvent.setup();
    const onChange = renderSection(null);

    await user.click(screen.getByRole("switch", { name: "리마인드" }));

    expect(onChange).toHaveBeenCalledWith(new Date(2026, 7, 15, 9, 0));
  });

  it("값과 일치하는 프리셋 칩만 선택 상태다", () => {
    renderSection(new Date(2026, 7, 17, 9, 0));

    expect(screen.getByRole("button", { name: "3일 후" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("button", { name: "내일" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("날짜·남은 기간·시간을 보이고, 행을 누르면 피커를 연다", async () => {
    const user = userEvent.setup();
    const onPickDate = vi.fn();
    const onPickTime = vi.fn();
    render(
      <RemindSection
        value={new Date(2026, 7, 15, 9, 0)}
        now={NOW}
        onChange={vi.fn()}
        onPickDate={onPickDate}
        onPickTime={onPickTime}
      />,
    );

    expect(screen.getByText("2026. 8. 15. 토요일")).toBeInTheDocument();
    expect(screen.getByText("1일 후")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /2026\. 8\. 15\./ }));
    await user.click(screen.getByRole("button", { name: /오전 9:00/ }));

    expect(onPickDate).toHaveBeenCalledTimes(1);
    expect(onPickTime).toHaveBeenCalledTimes(1);
  });
});

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
