import type { ClientOptions } from "@shared/analytics/analytics.client";
import { AnalyticsClient } from "@shared/analytics/analytics.client";
import type { ScreenTracking } from "@shared/analytics/analytics.screen";
import { act, renderHook } from "@testing-library/react-native";
import { AppState, Dimensions, type View } from "react-native";
import { AnalyticsContext } from "@/components/analytics/AnalyticsContext";
import { useScreenTracking } from "@/hooks/useScreenTracking";
import { useTrackImpression } from "./useTrackImpression";

let mockFocused = true;
jest.mock("expo-router", () => ({ useIsFocused: () => mockFocused }));
const analyticsOptions: ClientOptions = {
  source: "app",
  environment: "development",
  newId: () => "id",
  send: async () => {},
};
const client = new AnalyticsClient({
  ...analyticsOptions,
});
client.initialize("anon", analyticsOptions.newId());
let collector: ScreenTracking;
const runtime = {
  client,
  ready: Promise.resolve(),
  identify: () => false,
  suspendIdentity: () => {},
  setUtm: () => {},
  capture: jest.fn(),
  pendingTouch: null,
  acknowledgeTouch: jest.fn(),
  subscribeTouch: () => () => {},
};
function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <AnalyticsContext
      value={{ runtime, screen: collector, screenKey: "visit" }}
    >
      {children}
    </AnalyticsContext>
  );
}
beforeEach(async () => {
  jest.useFakeTimers();
  mockFocused = true;
  Object.defineProperty(AppState, "currentState", {
    configurable: true,
    writable: true,
    value: "active",
  });
  jest
    .spyOn(Dimensions, "get")
    .mockReturnValue({ width: 100, height: 100, scale: 1, fontScale: 1 });
  const hook = await renderHook(() =>
    useScreenTracking(client, analyticsOptions.newId),
  );
  collector = hook.result.current!;
  await act(() => collector.view("login", "login"));
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});
test("현재 화면에서 40% 이상 1초 보인 뒤 노출을 기록한다", async () => {
  const impression = jest.spyOn(client, "trackEvent").mockReturnValue(true);
  const { result } = await renderHook(
    () =>
      useTrackImpression("login.google", {
        custom_data: { provider: "google", nested: { tags: ["test"] } },
      }),
    {
      wrapper: Wrapper,
    },
  );
  result.current.current = {
    measureInWindow: (
      callback: (x: number, y: number, w: number, h: number) => void,
    ) => callback(60, 0, 100, 100),
  } as View;
  await act(() => jest.advanceTimersByTime(1000));
  expect(impression).not.toHaveBeenCalled();
  await act(() => jest.advanceTimersByTime(250));
  expect(impression).toHaveBeenCalledWith(
    {
      event_name: "component_impression",
      custom_data: expect.objectContaining({
        label: "login.google",
        provider: "google",
        nested: { tags: ["test"] },
      }),
    },
    undefined,
  );
});
test("네비게이터에 남아 있는 비활성 화면은 노출로 세지 않는다", async () => {
  mockFocused = false;
  const impression = jest.spyOn(client, "trackEvent").mockReturnValue(true);
  const { result } = await renderHook(
    () => useTrackImpression("login.google"),
    {
      wrapper: Wrapper,
    },
  );
  result.current.current = {
    measureInWindow: (
      callback: (x: number, y: number, w: number, h: number) => void,
    ) => callback(0, 0, 100, 100),
  } as View;
  await act(() => jest.advanceTimersByTime(2000));
  expect(impression).not.toHaveBeenCalled();
});

test("노출 수락 후 옵션·포커스가 바뀌어도 측정을 재개하지 않는다", async () => {
  const impression = jest.spyOn(client, "trackEvent").mockReturnValue(true);
  const remove = jest.fn();
  jest.spyOn(AppState, "addEventListener").mockReturnValue({ remove });
  const { result, rerender } = await renderHook(
    ({ disabled }: { disabled: boolean }) =>
      useTrackImpression("login.google", { disabled }),
    {
      wrapper: Wrapper,
      initialProps: { disabled: false },
    },
  );
  const measureInWindow = jest.fn(
    (callback: (x: number, y: number, w: number, h: number) => void) =>
      callback(0, 0, 100, 100),
  );
  result.current.current = { measureInWindow } as unknown as View;
  await act(() => jest.advanceTimersByTime(1500));
  expect(remove).toHaveBeenCalledTimes(1);
  const count = measureInWindow.mock.calls.length;
  await rerender({ disabled: true });
  await rerender({ disabled: false });
  mockFocused = false;
  await rerender({ disabled: false });
  mockFocused = true;
  await rerender({ disabled: false });
  await act(() => jest.advanceTimersByTime(5000));
  expect(impression).toHaveBeenCalledTimes(1);
  expect(measureInWindow).toHaveBeenCalledTimes(count);
});

test("커스텀 데이터가 바뀌어도 노출 시간을 유지하고 기록 시 최신 값을 사용한다", async () => {
  const impression = jest.spyOn(client, "trackEvent").mockReturnValue(true);
  const { result, rerender } = await renderHook(
    ({ data }: { data: { position: number } }) =>
      useTrackImpression("card", { custom_data: data }),
    { wrapper: Wrapper, initialProps: { data: { position: 1 } } },
  );
  result.current.current = {
    measureInWindow: (
      callback: (x: number, y: number, w: number, h: number) => void,
    ) => callback(0, 0, 100, 100),
  } as View;
  await act(() => jest.advanceTimersByTime(750));
  await rerender({ data: { position: 2 } });
  await act(() => jest.advanceTimersByTime(500));
  expect(impression).toHaveBeenCalledTimes(1);
  expect(impression).toHaveBeenCalledWith(
    {
      event_name: "component_impression",
      custom_data: expect.objectContaining({ label: "card", position: 2 }),
    },
    undefined,
  );
});
test("노출 기록이 거절되면 같은 화면에서 반복해서 다시 시도하지 않는다", async () => {
  const impression = jest.spyOn(client, "trackEvent").mockReturnValue(false);
  const { result } = await renderHook(
    () => useTrackImpression("login.google"),
    {
      wrapper: Wrapper,
    },
  );
  result.current.current = {
    measureInWindow: (
      callback: (x: number, y: number, w: number, h: number) => void,
    ) => callback(0, 0, 100, 100),
  } as View;
  await act(() => jest.advanceTimersByTime(5000));
  expect(impression).toHaveBeenCalledTimes(1);
});
