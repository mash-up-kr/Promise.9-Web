import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { installChromeMock } from "@/test/chromeMock";

import { useActiveTab } from "./useActiveTab";

const FIRST = {
  url: "https://toss.tech/article/1",
  title: "첫 번째 글",
  favIconUrl: undefined,
};
const SECOND = {
  url: "https://toss.tech/article/2",
  title: "두 번째 글",
  favIconUrl: undefined,
};

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("useActiveTab", () => {
  it("현재 활성 탭을 읽어온다", async () => {
    installChromeMock({ tab: FIRST });

    const { result } = renderHook(() => useActiveTab());

    await waitFor(() => expect(result.current?.url).toBe(FIRST.url));
  });

  it("다른 탭으로 전환하면 그 탭을 따라간다", async () => {
    // 사이드바는 열린 채 탭을 옮겨다닐 수 있다 — 저장 대상이 따라가지 않으면 엉뚱한 링크를 저장한다.
    const chromeMock = installChromeMock({ tab: FIRST });

    const { result } = renderHook(() => useActiveTab());
    await waitFor(() => expect(result.current?.url).toBe(FIRST.url));

    chromeMock.setActiveTab(SECOND);
    act(() => chromeMock.emitTabActivated());

    await waitFor(() => expect(result.current?.url).toBe(SECOND.url));
  });

  it("같은 탭에서 페이지를 이동해도 따라간다", async () => {
    const chromeMock = installChromeMock({ tab: FIRST });

    const { result } = renderHook(() => useActiveTab());
    await waitFor(() => expect(result.current?.url).toBe(FIRST.url));

    chromeMock.setActiveTab(SECOND);
    act(() => chromeMock.emitTabUpdated());

    await waitFor(() => expect(result.current?.url).toBe(SECOND.url));
  });

  it("언마운트하면 탭 리스너를 정리한다", async () => {
    const chromeMock = installChromeMock({ tab: FIRST });

    const { result, unmount } = renderHook(() => useActiveTab());
    await waitFor(() => expect(result.current?.url).toBe(FIRST.url));
    unmount();

    expect(chromeMock.tabListenerCount()).toBe(0);
  });
});
