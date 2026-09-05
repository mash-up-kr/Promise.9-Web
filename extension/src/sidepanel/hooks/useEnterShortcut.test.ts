import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useEnterShortcut } from "./useEnterShortcut";

const pressEnter = (init: KeyboardEventInit = {}) => {
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", ...init }));
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("useEnterShortcut", () => {
  it("Enter 로 주 동작을 실행한다", () => {
    const onEnter = vi.fn();
    renderHook(() => useEnterShortcut(onEnter));

    pressEnter();

    expect(onEnter).toHaveBeenCalledTimes(1);
  });

  // Enter 를 누르고 있으면 keydown 이 초당 수십 번 자동 반복된다 — 한 번 누른 것으로 본다.
  it("눌러 두어 반복되는 keydown 은 무시한다", () => {
    const onEnter = vi.fn();
    renderHook(() => useEnterShortcut(onEnter));

    pressEnter();
    pressEnter({ repeat: true });
    pressEnter({ repeat: true });

    expect(onEnter).toHaveBeenCalledTimes(1);
  });

  it("enabled 가 false 면 동작하지 않는다", () => {
    const onEnter = vi.fn();
    renderHook(() => useEnterShortcut(onEnter, false));

    pressEnter();

    expect(onEnter).not.toHaveBeenCalled();
  });
});
