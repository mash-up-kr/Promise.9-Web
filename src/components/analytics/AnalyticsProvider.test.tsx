import { toUtf8 } from "@smithy/util-utf8";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { StrictMode } from "react";
import { Platform, Pressable, Text } from "react-native";
import { useAnalytics } from "./AnalyticsContext";
import { AnalyticsProvider } from "./AnalyticsProvider";

const mockSend = jest
  .fn<Promise<void>, [Uint8Array[], AbortSignal]>()
  .mockResolvedValue(undefined);
const mockIsReloadNavigation = jest.fn(() => false);
let mockPath = "/login";
let mockIsInitiallyActive = true;
let mockActivityChange = (_isActive: boolean) => {};
let mockResolve: (value: string | null) => void = () => {};
let mockRead: Promise<string | null>;
jest.mock("@/lib/analytics/analytics.platform", () => ({
  prepareAnalyticsPlatform: () => {},
  supportsAnalyticsKeepalive: () => false,
  newAnalyticsId: () => `id-${Math.random()}`,
  isAnalyticsActive: () => mockIsInitiallyActive,
  analyticsStorage: { get: () => mockRead, set: async () => {} },
  bindPlatformAnalytics: (
    _capture: unknown,
    activityChanged: (active: boolean) => void,
  ) => {
    mockActivityChange = activityChanged;
    activityChanged(mockIsInitiallyActive);
    return () => {
      mockActivityChange = () => {};
    };
  },
  subscribeIdentityChanges: () => () => {},
  isReloadNavigation: () => mockIsReloadNavigation(),
  getAnalyticsEnvironment: () => ({
    os: "ios",
    browser: null,
    clientVersion: "1",
  }),
}));
jest.mock("@shared/analytics/analytics.runtime", () => {
  const actual = jest.requireActual("@shared/analytics/analytics.runtime");
  return {
    ...actual,
    createAnalytics: (options: object) =>
      actual.createAnalytics({ ...options, send: mockSend }),
  };
});
jest.mock("@shared/api", () => ({
  getRefreshToken: async () => null,
  apiClient: {},
}));
jest.mock("expo-router", () => ({
  usePathname: () => mockPath,
  useSegments: () =>
    mockPath === "/login" ? ["(auth)", "login"] : ["(tabs)", "index"],
  useGlobalSearchParams: () => ({ utm_source: "newsletter" }),
}));
beforeEach(() => {
  jest.clearAllMocks();
  mockIsReloadNavigation.mockReturnValue(false);
  mockPath = "/login";
  mockIsInitiallyActive = true;
  mockActivityChange = () => {};
  mockRead = new Promise((resolve) => {
    mockResolve = resolve;
  });
  process.env.EXPO_PUBLIC_ANALYTICS_ENABLED = "true";
  process.env.EXPO_PUBLIC_ANALYTICS_REGION = "region";
  process.env.EXPO_PUBLIC_ANALYTICS_IDENTITY_POOL_ID = "pool";
  process.env.EXPO_PUBLIC_ANALYTICS_STREAM_NAME = "stream";
});
afterEach(() => {
  jest.restoreAllMocks();
  delete process.env.EXPO_PUBLIC_ANALYTICS_ENABLED;
});
function Action() {
  const analytics = useAnalytics();
  return (
    <Pressable
      onPress={() =>
        analytics.trackEvent({
          event_name: "page_view",
          custom_data: {
            screen_name: "manual",
            screen_view_id: "manual-visit",
            path: "/manual",
            duration_ms: 100,
          },
        })
      }
    >
      <Text>save</Text>
    </Pressable>
  );
}
test("저장소 초기화가 끝나지 않아도 화면과 수집 API를 제공한다", async () => {
  const view = await render(
    <AnalyticsProvider>
      <Action />
    </AnalyticsProvider>,
  );
  expect(screen.getByText("save")).toBeOnTheScreen();
  await fireEvent.press(screen.getByText("save"));
  await act(async () => {
    mockResolve(null);
  });
  await view.unmount();
  const events = mockSend.mock.calls.flatMap(([records]) =>
    records.map((record) => JSON.parse(toUtf8(record))),
  );
  expect(events).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        event_name: "page_view",
        custom_data: JSON.stringify({
          screen_name: "manual",
          screen_view_id: "manual-visit",
          path: "/manual",
          duration_ms: 100,
        }),
      }),
    ]),
  );
});
test("비활성 상태에서는 저장소 준비 없이 화면을 표시한다", async () => {
  process.env.EXPO_PUBLIC_ANALYTICS_ENABLED = "false";
  await render(
    <AnalyticsProvider>
      <Action />
    </AnalyticsProvider>,
  );
  expect(screen.getByText("save")).toBeOnTheScreen();
  expect(mockIsReloadNavigation).not.toHaveBeenCalled();
});

test.each([
  ["ios", false, "in"],
  ["web", false, "in"],
  ["web", true, "reload"],
] as const)("%s, 새로고침=%s: %s를 한 번 기록하고 화면 이동과 구분한다", async (os, isReload, eventName) => {
  jest.replaceProperty(Platform, "OS", os);
  mockIsReloadNavigation.mockReturnValue(isReload);
  const app = (
    <StrictMode>
      <AnalyticsProvider>
        <Action />
      </AnalyticsProvider>
    </StrictMode>
  );
  const view = await render(app);
  expect(mockSend).not.toHaveBeenCalled();
  await act(async () => {
    mockResolve(null);
  });
  mockPath = "/";
  await view.rerender(
    <StrictMode>
      <AnalyticsProvider>
        <Action />
      </AnalyticsProvider>
    </StrictMode>,
  );
  await view.unmount();
  const events = mockSend.mock.calls.flatMap(([records]) =>
    records.map((data) => JSON.parse(toUtf8(data))),
  );
  const entries = events.filter(
    (event) => event.event_name === "in" || event.event_name === "reload",
  );
  expect(entries).toHaveLength(1);
  expect(events[0]).toBe(entries[0]);
  expect(entries[0]).toMatchObject({
    event_name: eventName,
    source: os === "web" ? "web" : "app",
    anonymous_id: expect.any(String),
    session_id: expect.any(String),
    user_id: null,
    utm: { utm_source: "newsletter" },
    custom_data: "{}",
  });
  expect(events.map((event) => event.event_name)).toEqual([
    eventName,
    "page_view",
    "page_view",
  ]);
  expect(events.slice(1).map((event) => JSON.parse(event.custom_data))).toEqual(
    [
      {
        screen_name: "login",
        path: "/login",
        screen_view_id: expect.any(String),
        duration_ms: expect.any(Number),
      },
      {
        screen_name: "home",
        path: "/",
        screen_view_id: expect.any(String),
        duration_ms: expect.any(Number),
      },
    ],
  );
});

test("처음부터 비활성이면 보이지 않은 화면 방문을 만들지 않는다", async () => {
  mockIsInitiallyActive = false;
  const view = await render(
    <AnalyticsProvider>
      <Action />
    </AnalyticsProvider>,
  );
  await act(async () => {
    mockResolve(null);
  });
  await view.unmount();
  const events = mockSend.mock.calls.flatMap(([records]) =>
    records.map((record) => JSON.parse(toUtf8(record))),
  );
  expect(
    events.filter((event) => event.event_name === "page_view"),
  ).toHaveLength(0);
});

test("루트 해제는 마지막 화면의 페이지뷰를 한 번만 기록한다", async () => {
  const view = await render(
    <AnalyticsProvider>
      <Action />
    </AnalyticsProvider>,
  );
  await act(async () => {
    mockResolve(null);
  });
  await view.unmount();
  const events = mockSend.mock.calls.flatMap(([records]) =>
    records.map((record) => JSON.parse(toUtf8(record))),
  );
  const pageViews = events.filter((event) => event.event_name === "page_view");
  expect(pageViews).toHaveLength(1);
  expect(JSON.parse(pageViews[0].custom_data)).toEqual({
    screen_name: "login",
    path: "/login",
    screen_view_id: expect.any(String),
    duration_ms: expect.any(Number),
  });
});

test("저장소 복구 중 비활성화되어도 실제로 보인 시간만 기록한다", async () => {
  let elapsed = 0;
  jest.spyOn(performance, "now").mockImplementation(() => elapsed);
  const view = await render(
    <AnalyticsProvider>
      <Action />
    </AnalyticsProvider>,
  );
  elapsed = 1000;
  await act(() => {
    mockIsInitiallyActive = false;
    mockActivityChange(false);
  });
  elapsed = 10000;
  await act(async () => {
    mockResolve(null);
  });
  expect(mockSend).toHaveBeenCalled();
  await view.unmount();
  const events = mockSend.mock.calls.flatMap(([records]) =>
    records.map((record) => JSON.parse(toUtf8(record))),
  );
  const pageViews = events.filter((event) => event.event_name === "page_view");
  expect(pageViews).toHaveLength(1);
  expect(JSON.parse(pageViews[0].custom_data)).toMatchObject({
    duration_ms: 1000,
    path: "/login",
  });
});
