import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { WheelColumn, WheelPicker } from "./WheelPicker";

const HOURS = [9, 10, 11, 12];
/** WheelPicker 의 ITEM_HEIGHT 와 같은 값. */
const ITEM_HEIGHT = 40;

function renderColumn(value: number, onChange: (value: number) => void) {
  const column = (next: number) => (
    <WheelPicker>
      <WheelColumn
        label="시"
        options={HOURS}
        value={next}
        onChange={onChange}
      />
    </WheelPicker>
  );
  const { rerender } = render(column(value));

  return {
    list: screen.getByRole("group", { name: "시" }),
    setValue: (next: number) => rerender(column(next)),
  };
}

/** jsdom 은 레이아웃이 없어 scrollTop 이 항상 0 이다 — 값을 직접 심고 스크롤을 알린다. */
function scrollTo(list: HTMLElement, top: number) {
  Object.defineProperty(list, "scrollTop", {
    value: top,
    writable: true,
    configurable: true,
  });
  fireEvent.scroll(list);
}

describe("WheelColumn", () => {
  it("스크롤해서 가운데로 온 값을 알린다", () => {
    const onChange = vi.fn();
    const { list } = renderColumn(9, onChange);

    scrollTo(list, ITEM_HEIGHT + 15);

    expect(onChange).toHaveBeenCalledWith(10);
  });

  // 스크롤 도중 스냅 지점으로 위치를 되돌리면 관성이 끊겨 한 번 밀 때마다 한 칸씩만 넘어간다.
  it("사용자가 스크롤해서 바뀐 값이면 위치를 되돌리지 않는다", () => {
    const onChange = vi.fn();
    const { list, setValue } = renderColumn(9, onChange);

    scrollTo(list, ITEM_HEIGHT + 15);
    setValue(10);

    expect(list.scrollTop).toBe(ITEM_HEIGHT + 15);
  });

  it("밖에서 값이 바뀌면 그 항목이 가운데 오도록 맞춘다", () => {
    const onChange = vi.fn();
    const { list, setValue } = renderColumn(9, onChange);

    scrollTo(list, ITEM_HEIGHT + 15);
    setValue(12);

    expect(list.scrollTop).toBe(3 * ITEM_HEIGHT);
  });
});
