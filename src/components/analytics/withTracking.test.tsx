import type { ClientOptions } from "@shared/analytics/analytics.client";
import { AnalyticsClient } from "@shared/analytics/analytics.client";
import type { ScreenTracking } from "@shared/analytics/analytics.screen";
import { toUtf8 } from "@smithy/util-utf8";
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
} from "@testing-library/react-native";
import { createRef, type Ref, useImperativeHandle } from "react";
import { AppState, Dimensions, Pressable, type View } from "react-native";
import { useScreenTracking } from "@/hooks/useScreenTracking";
import { AnalyticsContext } from "./AnalyticsContext";
import { withTracking } from "./withTracking";

let mockFocused = true;
jest.mock("expo-router", () => ({ useIsFocused: () => mockFocused }));
const node = { measureInWindow: jest.fn() } as unknown as View;
const received = jest.fn();
function Button(props: {
  ref?: Ref<View>;
  onPress: (value: string) => void;
  disabled?: boolean;
}) {
  received(props);
  useImperativeHandle(props.ref, () => node, []);
  return (
    <Pressable
      accessibilityLabel="save"
      disabled={props.disabled}
      onPress={() => props.onPress("original")}
    />
  );
}
const TrackedButton = withTracking(Button);
const send = jest.fn(async (_records: Uint8Array[]) => {});
let client: AnalyticsClient;
let collector: ScreenTracking;
beforeEach(async () => {
  jest.clearAllMocks();
  mockFocused = true;
  const analyticsOptions: ClientOptions = {
    source: "app",
    environment: "development",
    newId: () => "id",
    send,
  };
  client = new AnalyticsClient({
    ...analyticsOptions,
  });
  client.initialize("anon", analyticsOptions.newId());
  const hook = await renderHook(() =>
    useScreenTracking(client, analyticsOptions.newId),
  );
  collector = hook.result.current!;
  await act(() => collector.view("home", "/"));
});
afterEach(() => client.dispose());
function Wrapper({ children }: { children: React.ReactNode }) {
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
  return (
    <AnalyticsContext
      value={{
        runtime,
        screen: collector,
        screenKey: collector.screenViewId ?? "",
      }}
    >
      {children}
    </AnalyticsContext>
  );
}

test("원래 콜백 인자·ref를 보존하고 tracking props 없이 클릭을 공통 코어로 한 번 전달한다", async () => {
  const onPress = jest.fn();
  const ref = createRef<View>();
  const { unmount, rerender } = await render(
    <TrackedButton
      ref={ref}
      onPress={onPress}
      tracking={{
        label: "save",
        custom_data: { link_id: 42, details: { tags: ["news"] } },
      }}
    />,
    { wrapper: Wrapper },
  );
  expect(ref.current).toBe(node);
  expect(received.mock.calls.at(-1)?.[0]).not.toHaveProperty("tracking");
  await fireEvent.press(screen.getByLabelText("save"));
  expect(onPress).toHaveBeenCalledWith("original");
  await rerender(
    <TrackedButton
      ref={ref}
      onPress={onPress}
      tracking={{
        label: "updated",
        custom_data: { link_id: 43 },
      }}
    />,
  );
  await fireEvent.press(screen.getByLabelText("save"));
  await client.flush();
  const clicks = send.mock.calls
    .flatMap(([records]) => records.map((data) => JSON.parse(toUtf8(data))))
    .filter((event) => event.event_name === "component_clicked");
  expect(clicks.map((event) => JSON.parse(event.custom_data).label)).toEqual([
    "save",
    "updated",
  ]);
  expect(clicks[0].anonymous_id).toBe("anon");
  expect(JSON.parse(clicks[0].custom_data)).toMatchObject({
    link_id: 42,
    details: { tags: ["news"] },
  });
  expect(JSON.parse(clicks[1].custom_data)).toMatchObject({ link_id: 43 });
  await unmount();
  expect(ref.current).toBeNull();
});

test("React 19 callback ref의 정리 함수를 보존한다", async () => {
  const cleanup = jest.fn();
  const ref = jest.fn(() => cleanup);
  const { unmount } = await render(
    <TrackedButton
      ref={ref}
      onPress={jest.fn()}
      tracking={{ label: "save" }}
    />,
    { wrapper: Wrapper },
  );
  expect(ref).toHaveBeenCalledWith(node);
  await unmount();
  expect(cleanup).toHaveBeenCalledTimes(1);
});

test("잘못된 커스텀 데이터로 이벤트가 거절돼도 원래 버튼 동작은 수행한다", async () => {
  const onPress = jest.fn();
  await render(
    <TrackedButton
      onPress={onPress}
      tracking={{
        label: "save",
        custom_data: { score: Infinity },
      }}
    />,
    { wrapper: Wrapper },
  );
  await fireEvent.press(screen.getByLabelText("save"));
  expect(onPress).toHaveBeenCalledWith("original");
  await client.flush();
  const events = send.mock.calls.flatMap(([records]) =>
    records.map((data) => JSON.parse(toUtf8(data))),
  );
  expect(events.some((event) => event.event_name === "component_clicked")).toBe(
    false,
  );
});

test.each([
  "disabled",
  "tracking-disabled",
  "unfocused",
])("%s일 때 클릭을 수집하지 않는다", async (mode) => {
  mockFocused = mode !== "unfocused";
  const click = jest.spyOn(client, "trackEvent");
  const onPress = jest.fn();
  await render(
    <TrackedButton
      onPress={onPress}
      disabled={mode === "disabled"}
      tracking={{
        label: "save",
        disabled: mode === "tracking-disabled",
      }}
    />,
    { wrapper: Wrapper },
  );
  await fireEvent.press(screen.getByLabelText("save"));
  expect(click).not.toHaveBeenCalled();
  if (mode !== "disabled") expect(onPress).toHaveBeenCalledWith("original");
});

test("HOC의 ref를 노출 훅에 연결하고 노출 후 측정을 멈춘다", async () => {
  jest.useFakeTimers();
  const previousState = AppState.currentState;
  AppState.currentState = "active";
  const dimensions = jest
    .spyOn(Dimensions, "get")
    .mockReturnValue({ width: 100, height: 100, scale: 1, fontScale: 1 });
  const measure = jest
    .mocked(node.measureInWindow)
    .mockImplementation((callback) => callback(0, 0, 100, 100));
  const impression = jest.spyOn(client, "trackEvent");
  const { unmount } = await render(
    <TrackedButton onPress={jest.fn()} tracking={{ label: "save" }} />,
    { wrapper: Wrapper },
  );
  try {
    await act(() => jest.advanceTimersByTime(1500));
    expect(impression).toHaveBeenCalledTimes(1);
    expect(impression.mock.results[0].value).toBe(true);
    const measured = measure.mock.calls.length;
    await act(() => jest.advanceTimersByTime(1000));
    expect(measure).toHaveBeenCalledTimes(measured);
  } finally {
    await unmount();
    dimensions.mockRestore();
    AppState.currentState = previousState;
    client.dispose();
    jest.useRealTimers();
  }
});

test("같은 label의 두 컴포넌트와 새로 마운트한 컴포넌트는 각각 노출을 기록한다", async () => {
  jest.useFakeTimers();
  const previousState = AppState.currentState;
  AppState.currentState = "active";
  const dimensions = jest
    .spyOn(Dimensions, "get")
    .mockReturnValue({ width: 100, height: 100, scale: 1, fontScale: 1 });
  jest
    .mocked(node.measureInWindow)
    .mockImplementation((callback) => callback(0, 0, 100, 100));
  const buttons = (firstKey: string) => (
    <>
      <TrackedButton
        key={firstKey}
        onPress={jest.fn()}
        tracking={{ label: "card", custom_data: { link_id: 1 } }}
      />
      <TrackedButton
        key="second"
        onPress={jest.fn()}
        tracking={{ label: "card", custom_data: { link_id: 2 } }}
      />
    </>
  );
  const { unmount, rerender } = await render(buttons("first"), {
    wrapper: Wrapper,
  });
  const impressions = () =>
    send.mock.calls
      .flatMap(([records]) => records.map((data) => JSON.parse(toUtf8(data))))
      .filter((event) => event.event_name === "component_impression")
      .map((event) => JSON.parse(event.custom_data));
  try {
    await act(() => jest.advanceTimersByTime(1500));
    await client.flush();
    expect(impressions().map((data) => data.link_id)).toEqual([1, 2]);
    await rerender(buttons("remounted"));
    await act(() => jest.advanceTimersByTime(1500));
    await client.flush();
    expect(impressions().map((data) => data.link_id)).toEqual([1, 2, 1]);
  } finally {
    await unmount();
    dimensions.mockRestore();
    AppState.currentState = previousState;
    client.dispose();
    jest.useRealTimers();
  }
});

test.each([
  undefined,
  { label: "" },
  { label: "   " },
])("tracking과 유효한 label이 없으면 수집 없이 원래 동작을 수행한다: %j", async (tracking) => {
  const click = jest.spyOn(client, "trackEvent");
  const onPress = jest.fn();
  await render(<TrackedButton onPress={onPress} tracking={tracking} />, {
    wrapper: Wrapper,
  });
  await fireEvent.press(screen.getByLabelText("save"));
  expect(onPress).toHaveBeenCalledWith("original");
  expect(click).not.toHaveBeenCalled();
});
