import { act } from "@testing-library/react-native";
import * as Linking from "expo-linking";
import { AppState, type AppStateStatus } from "react-native";
import { bindPlatformAnalytics } from "./analytics.platform";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));
jest.mock("expo-crypto", () => ({
  randomUUID: () => "id",
  getRandomValues: jest.fn(),
}));
jest.mock("expo-linking", () => ({
  getInitialURL: jest.fn(),
  parse: jest.fn(),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
}));
const originalAppState = AppState.currentState;
afterEach(() => {
  AppState.currentState = originalAppState;
  jest.restoreAllMocks();
});

test("앱의 초기 상태와 inactive·background·active 전환을 수집기에 전달한다", () => {
  AppState.currentState = "active";
  const activityChanged = jest.fn();
  let change = (_state: AppStateStatus) => {};
  jest
    .spyOn(AppState, "addEventListener")
    .mockImplementation((_type, listener) => {
      change = listener;
      return { remove: jest.fn() };
    });
  jest.mocked(Linking.getInitialURL).mockResolvedValue(null);
  const stop = bindPlatformAnalytics(jest.fn(), activityChanged);
  change("inactive");
  change("background");
  change("active");
  expect(activityChanged.mock.calls).toEqual([
    [true],
    [false],
    [false],
    [true],
  ]);
  stop();
});

test("초기 딥링크의 UTM을 읽고 플랫폼 구독을 해제한다", async () => {
  AppState.currentState = "active";
  const activityChanged = jest.fn();
  const capture = jest.fn();
  const removeLink = jest.fn(),
    removeState = jest.fn();
  jest
    .mocked(Linking.getInitialURL)
    .mockResolvedValue("dingdong://login?utm_source=sns");
  jest.mocked(Linking.parse).mockReturnValue({
    queryParams: { utm_source: "sns" },
    scheme: "dingdong",
    hostname: "login",
    path: null,
  });
  jest
    .mocked(Linking.addEventListener)
    .mockReturnValue({ remove: removeLink } as unknown as ReturnType<
      typeof Linking.addEventListener
    >);
  jest
    .spyOn(AppState, "addEventListener")
    .mockReturnValue({ remove: removeState });
  const stop = bindPlatformAnalytics(capture, activityChanged);
  await act(async () => {});
  expect(capture).toHaveBeenCalledWith({ utm_source: "sns" });
  stop();
  expect(removeLink).toHaveBeenCalledTimes(1);
  expect(removeState).toHaveBeenCalledTimes(1);
});

test("초기 딥링크 조회 중에도 구독을 해제하고 늦은 응답은 수집하지 않는다", async () => {
  let resolveInitialUrl: (url: string | null) => void = () => {};
  jest.mocked(Linking.getInitialURL).mockReturnValue(
    new Promise((resolve) => {
      resolveInitialUrl = resolve;
    }),
  );
  const removeLink = jest.fn();
  const removeAppState = jest.fn();
  jest.mocked(Linking.addEventListener).mockReturnValue({
    remove: removeLink,
  } as unknown as ReturnType<typeof Linking.addEventListener>);
  jest.spyOn(AppState, "addEventListener").mockReturnValue({
    remove: removeAppState,
  });
  const capture = jest.fn();
  const stop = bindPlatformAnalytics(capture, jest.fn());
  stop();
  await act(async () => {
    resolveInitialUrl("dingdong://login?utm_source=sns");
  });
  expect(capture).not.toHaveBeenCalled();
  expect(removeLink).toHaveBeenCalledTimes(1);
  expect(removeAppState).toHaveBeenCalledTimes(1);
});
