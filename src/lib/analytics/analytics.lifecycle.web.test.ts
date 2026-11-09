/** @jest-environment jsdom */
import { bindBrowserLifecycle } from "./analytics.lifecycle.web";

afterEach(() => jest.restoreAllMocks());

test("브라우저 숨김·종료·복귀를 전달하고 구독 해제 뒤에는 전달하지 않는다", () => {
  const visibility = jest
    .spyOn(document, "visibilityState", "get")
    .mockReturnValue("visible");
  const activityChanged = jest.fn();
  const stop = bindBrowserLifecycle(activityChanged);
  try {
    visibility.mockReturnValue("hidden");
    document.dispatchEvent(new Event("visibilitychange"));
    window.dispatchEvent(new Event("pagehide"));
    visibility.mockReturnValue("visible");
    document.dispatchEvent(new Event("visibilitychange"));
    window.dispatchEvent(new Event("pageshow"));
    expect(activityChanged.mock.calls).toEqual([
      [true],
      [false],
      [false],
      [true],
      [true],
    ]);
    stop();
    activityChanged.mockClear();
    document.dispatchEvent(new Event("visibilitychange"));
    window.dispatchEvent(new Event("pagehide"));
    window.dispatchEvent(new Event("pageshow"));
    expect(activityChanged).not.toHaveBeenCalled();
  } finally {
    stop();
  }
});

test("처음부터 숨겨진 문서의 상태를 반영하고 pageshow에서 활성 상태를 다시 읽는다", () => {
  const visibility = jest
    .spyOn(document, "visibilityState", "get")
    .mockReturnValue("hidden");
  const activityChanged = jest.fn();
  const stop = bindBrowserLifecycle(activityChanged);
  try {
    visibility.mockReturnValue("visible");
    window.dispatchEvent(new Event("pageshow"));
    expect(activityChanged.mock.calls).toEqual([[false], [true]]);
  } finally {
    stop();
  }
});
