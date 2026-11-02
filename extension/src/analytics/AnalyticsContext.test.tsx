import type { ClientOptions } from "@shared/analytics/analytics.client";
import { AnalyticsClient } from "@shared/analytics/analytics.client";
import type { AnalyticsRuntime } from "@shared/analytics/analytics.runtime";
import { createScreenTracking } from "@shared/analytics/analytics.screen";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import {
  AnalyticsScreen,
  ExtensionAnalyticsProvider,
  useAnalyticsScreen,
  useTrack,
} from "./AnalyticsContext";
import { useDomTrack } from "./useDomTrack";

test.each([
  { label: "", disabled: false },
  { label: "   ", disabled: false },
  { label: "save", disabled: true },
])("빈 라벨·비활성 대상은 클릭과 노출을 등록하지 않는다: %j", (options) => {
  const observe = vi.fn();
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe = observe;
      unobserve() {}
      disconnect() {}
    },
  );
  const client = new AnalyticsClient({
    source: "extension",
    environment: "development",
    newId: () => "id",
    send: async () => {},
  });
  const screen = createScreenTracking(
    client,
    () => "view",
    () => {},
  );
  screen.view("save", "/save");
  const trackEvent = vi.fn(() => true);
  function Button() {
    const tracking = useDomTrack(
      screen,
      trackEvent,
      options.label,
      "view",
      options,
    );
    return (
      <button type="button" ref={tracking.ref}>
        저장
      </button>
    );
  }
  const view = render(<Button />);
  act(() => view.getByRole("button").click());
  expect(trackEvent).not.toHaveBeenCalled();
  expect(observe).not.toHaveBeenCalled();
  view.unmount();
  client.dispose();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

test("탭 복귀는 같은 버튼의 노출을 반복하지 않고 새로 마운트한 버튼은 기록한다", () => {
  vi.useFakeTimers();
  const visibility = vi
    .spyOn(document, "visibilityState", "get")
    .mockReturnValue("visible");
  let intersect = () => {};
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(private readonly notify: IntersectionObserverCallback) {}
      observe(element: Element) {
        intersect = () =>
          this.notify(
            [
              {
                target: element,
                intersectionRatio: 0.4,
                isIntersecting: true,
              } as IntersectionObserverEntry,
            ],
            this as unknown as IntersectionObserver,
          );
      }
      unobserve() {}
      disconnect() {}
    },
  );
  let id = 0;
  const analyticsOptions: ClientOptions = {
    source: "extension",
    environment: "development",
    newId: () => `id-${++id}`,
    send: async () => {},
  };
  const client = new AnalyticsClient({
    ...analyticsOptions,
  });
  client.initialize("anon", analyticsOptions.newId());
  const trackEvent = vi.spyOn(client, "trackEvent");
  const runtime: AnalyticsRuntime = {
    client,
    ready: Promise.resolve(),
    identify: () => {},
    suspendIdentity: () => {},
    setUtm: () => {},
    capture: vi.fn(),
    pendingTouch: null,
    acknowledgeTouch: vi.fn(),
    subscribeTouch: () => () => {},
  };
  let currentViewId: string | null = null;
  function Button() {
    currentViewId = useAnalyticsScreen().screen?.screenViewId ?? null;
    const tracking = useTrack("save");
    return (
      <button type="button" ref={tracking.ref}>
        저장
      </button>
    );
  }
  const view = render(
    <ExtensionAnalyticsProvider value={runtime}>
      <AnalyticsScreen name="save">
        <Button />
      </AnalyticsScreen>
    </ExtensionAnalyticsProvider>,
  );
  const firstId = currentViewId;
  act(() => {
    intersect();
    vi.advanceTimersByTime(1000);
  });
  act(() => {
    visibility.mockReturnValue("hidden");
    document.dispatchEvent(new Event("visibilitychange"));
  });
  act(() => {
    visibility.mockReturnValue("visible");
    document.dispatchEvent(new Event("visibilitychange"));
  });
  act(() => {
    intersect();
    vi.advanceTimersByTime(1000);
  });
  expect(currentViewId).not.toBe(firstId);
  const impressions = () =>
    trackEvent.mock.calls
      .map(([event]) => event)
      .filter((event) => event.event_name === "component_impression");
  expect(
    impressions().map((event) => event.custom_data?.screen_view_id),
  ).toEqual([firstId]);
  view.rerender(
    <ExtensionAnalyticsProvider value={runtime}>
      <AnalyticsScreen name="save">
        <Button key="new-button" />
      </AnalyticsScreen>
    </ExtensionAnalyticsProvider>,
  );
  act(() => {
    intersect();
    vi.advanceTimersByTime(1000);
  });
  expect(
    impressions().map((event) => event.custom_data?.screen_view_id),
  ).toEqual([firstId, currentViewId]);
  view.unmount();
  client.dispose();
});
