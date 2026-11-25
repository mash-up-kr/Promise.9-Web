/** @jest-environment jsdom */
import type { ClientOptions } from "@shared/analytics/analytics.client";
import { AnalyticsClient } from "@shared/analytics/analytics.client";
import type { ScreenTracking } from "@shared/analytics/analytics.screen";
import { act, createRef } from "react";
import { createRoot } from "react-dom/client";
import { Pressable, type View } from "react-native";
import { useScreenTracking } from "@/hooks/useScreenTracking";
import { AnalyticsContext } from "./AnalyticsContext";
import { withTracking } from "./withTracking";

jest.mock("expo-router", () => ({ useIsFocused: () => true }));
jest.mock("react-native", () => jest.requireActual("react-native-web"));
jest.mock("@/hooks/useTrackImpression", () =>
  jest.requireActual("@/hooks/useTrackImpression.web"),
);

// jsdom에 없는 브라우저 기본 인코더를 제공해 실제 UTF-8 전송 경로를 검증한다.
globalThis.TextEncoder =
  jest.requireActual<Pick<typeof globalThis, "TextEncoder">>(
    "node:util",
  ).TextEncoder;

// jsdom에서는 네이티브 Expo fetch의 지연 초기화를 사용하지 않는다.
Object.defineProperty(globalThis, "fetch", {
  value: jest.fn(),
  configurable: true,
  writable: true,
});
const TrackedPressable = withTracking(Pressable);
test("웹의 같은 label 컴포넌트는 각각 한 번 기록하고 옵션 변경·화면 복귀에도 관찰을 재개하지 않는다", async () => {
  jest.useFakeTimers();
  const visibility = jest
    .spyOn(document, "visibilityState", "get")
    .mockReturnValue("visible");
  const previousObserver = Object.getOwnPropertyDescriptor(
    globalThis,
    "IntersectionObserver",
  );
  const observed = new Set<Element>();
  let notify: IntersectionObserverCallback = () => {};
  const unobserve = jest.fn((element: Element) => observed.delete(element));
  Object.defineProperty(globalThis, "IntersectionObserver", {
    configurable: true,
    value: class {
      constructor(callback: IntersectionObserverCallback) {
        notify = callback;
      }
      observe(element: Element) {
        observed.add(element);
      }
      unobserve = unobserve;
      disconnect() {
        observed.clear();
      }
    },
  });
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  let id = 0;
  const analyticsOptions: ClientOptions = {
    source: "web",
    environment: "development",
    newId: () => `id-${++id}`,
    send: async () => {},
  };
  const client = new AnalyticsClient({
    ...analyticsOptions,
  });
  client.initialize("anon", analyticsOptions.newId());
  const hook = await mountScreen(client, analyticsOptions.newId);
  const collector = hook.screen;
  await act(() => collector.view("home", "/"));
  const trackEvent = jest.spyOn(client, "trackEvent");
  const onPress = jest.fn();
  const runtime = {
    client,
    ready: Promise.resolve(),
    identify: () => false,
    suspendIdentity: () => {},
    setUtm: () => {},
    capture: () => {},
    pendingTouch: null,
    acknowledgeTouch: () => {},
    subscribeTouch: () => () => {},
  };
  const renderButtons = (disabled = false, version = 0, firstKey = "first") =>
    act(async () => {
      root.render(
        <AnalyticsContext
          value={{
            runtime,
            screen: collector,
            screenKey: collector.screenViewId ?? "",
          }}
        >
          <TrackedPressable
            key={firstKey}
            accessibilityRole="button"
            accessibilityLabel="first"
            onPress={onPress}
            tracking={{
              label: "card",
              disabled,
              custom_data: { link_id: 1, details: { version } },
            }}
          />
          <TrackedPressable
            key="second"
            accessibilityRole="button"
            accessibilityLabel="second"
            onPress={onPress}
            tracking={{ label: "card", disabled, custom_data: { link_id: 2 } }}
          />
        </AnalyticsContext>,
      );
    });
  const intersect = () =>
    notify(
      [...observed].map(
        (element) =>
          ({
            target: element,
            intersectionRatio: 1,
            isIntersecting: true,
            time: performance.now(),
          }) as IntersectionObserverEntry,
      ),
      {} as IntersectionObserver,
    );
  const impressions = () =>
    trackEvent.mock.calls
      .map(([event]) => event)
      .filter((event) => event.event_name === "component_impression");
  try {
    await renderButtons();
    await act(async () => {
      intersect();
      jest.advanceTimersByTime(500);
    });
    await renderButtons(false, 1);
    await act(async () => jest.advanceTimersByTime(500));
    expect(impressions().map((event) => event.custom_data)).toEqual([
      expect.objectContaining({
        label: "card",
        link_id: 1,
        details: { version: 1 },
      }),
      expect.objectContaining({ label: "card", link_id: 2 }),
    ]);
    expect(observed.size).toBe(0);
    expect(unobserve).toHaveBeenCalledTimes(2);
    await renderButtons(true, 2);
    await renderButtons(false, 2);
    await act(async () => {
      collector.handleActivityChange(false);
      collector.handleActivityChange(true);
    });
    await renderButtons(false, 2);
    expect(observed.size).toBe(0);
    await act(async () => {
      intersect();
      jest.advanceTimersByTime(2000);
      host
        .querySelector('[aria-label="first"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(impressions()).toHaveLength(2);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(
      trackEvent.mock.calls
        .map(([event]) => event)
        .filter((event) => event.event_name === "component_clicked"),
    ).toEqual([
      expect.objectContaining({
        custom_data: expect.objectContaining({
          link_id: 1,
          details: { version: 2 },
        }),
      }),
    ]);
    await renderButtons(false, 3, "remounted");
    expect(observed.size).toBe(1);
    await act(async () => {
      intersect();
      jest.advanceTimersByTime(1000);
    });
    expect(impressions()).toHaveLength(3);
  } finally {
    await act(async () => root.unmount());
    await hook.unmount();
    client.dispose();
    host.remove();
    visibility.mockRestore();
    if (previousObserver)
      Object.defineProperty(
        globalThis,
        "IntersectionObserver",
        previousObserver,
      );
    else Reflect.deleteProperty(globalThis, "IntersectionObserver");
    jest.useRealTimers();
  }
});

test("웹 onPress와 DOM 관찰기가 함께 있어도 클릭은 한 번만 기록하고 DOM ref를 전달한다", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const analyticsOptions: ClientOptions = {
    source: "web",
    environment: "development",
    newId: () => "id",
    send: async () => {},
  };
  const client = new AnalyticsClient({
    ...analyticsOptions,
  });
  client.initialize("anon", analyticsOptions.newId());
  const hook = await mountScreen(client, analyticsOptions.newId);
  const collector = hook.screen;
  await act(() => collector.view("home", "/"));
  const click = jest.spyOn(client, "trackEvent");
  const onPress = jest.fn();
  const ref = createRef<View>();
  const runtime = {
    client,
    ready: Promise.resolve(),
    identify: () => false,
    suspendIdentity: () => {},
    setUtm: () => {},
    capture: () => {},
    pendingTouch: null,
    acknowledgeTouch: () => {},
    subscribeTouch: () => () => {},
  };
  try {
    await act(async () =>
      root.render(
        <AnalyticsContext
          value={{
            runtime,
            screen: collector,
            screenKey: collector.screenViewId ?? "",
          }}
        >
          <TrackedPressable
            accessibilityRole="button"
            ref={ref}
            onPress={onPress}
            tracking={{
              label: "save",
              custom_data: { link_id: 42, tags: ["news"] },
            }}
          />
        </AnalyticsContext>,
      ),
    );
    const button = host.querySelector('[role="button"]');
    expect(button).not.toBeNull();
    expect(ref.current).toBe(button);
    expect(button?.hasAttribute("data-label")).toBe(false);
    await act(async () => {
      button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    expect(click.mock.results[0].value).toBe(true);
    expect(click).toHaveBeenCalledWith(
      {
        event_name: "component_clicked",
        custom_data: expect.objectContaining({
          label: "save",
          link_id: 42,
          tags: ["news"],
        }),
      },
      undefined,
    );
    await act(async () =>
      root.render(
        <AnalyticsContext
          value={{
            runtime,
            screen: collector,
            screenKey: collector.screenViewId ?? "",
          }}
        >
          <TrackedPressable
            accessibilityRole="button"
            ref={ref}
            onPress={onPress}
          />
        </AnalyticsContext>,
      ),
    );
    const untrackedButton = host.querySelector('[role="button"]');
    expect(untrackedButton?.hasAttribute("data-label")).toBe(false);
    await act(async () => {
      untrackedButton?.dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
    });
    expect(onPress).toHaveBeenCalledTimes(2);
    expect(click).toHaveBeenCalledTimes(1);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    await hook.unmount();
    client.dispose();
  }
  expect(ref.current).toBeNull();
});

async function mountScreen(client: AnalyticsClient, newId: () => string) {
  const root = createRoot(document.createElement("div"));
  let screen: ScreenTracking | null = null;
  function Harness() {
    screen = useScreenTracking(client, newId);
    return null;
  }
  await act(async () => root.render(<Harness />));
  if (!screen) throw new Error("screen hook not mounted");
  return {
    screen: screen as ScreenTracking,
    unmount: () => act(async () => root.unmount()),
  };
}
