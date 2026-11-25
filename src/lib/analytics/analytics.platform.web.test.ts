/** @jest-environment jsdom */
import {
  isReloadNavigation,
  subscribeCollectingChanges,
  supportsAnalyticsKeepalive,
} from "./analytics.platform.web";

jest.mock("@shared/api/token", () => ({ subscribeTokens: () => () => {} }));

const originalEntries = Object.getOwnPropertyDescriptor(
  performance,
  "getEntriesByType",
);
afterEach(() => {
  if (originalEntries)
    Object.defineProperty(performance, "getEntriesByType", originalEntries);
  else Reflect.deleteProperty(performance, "getEntriesByType");
});

test.each([
  ["navigate", false],
  ["reload", true],
  ["back_forward", false],
  [undefined, false],
] as const)("브라우저 navigation 유형 %s의 새로고침 여부는 %s다", (type, expected) => {
  Object.defineProperty(performance, "getEntriesByType", {
    configurable: true,
    value: jest.fn((name: string) =>
      name === "navigation" && type ? [{ type }] : [],
    ),
  });
  expect(isReloadNavigation()).toBe(expected);
});

test("navigation API가 없으면 새로고침으로 추측하지 않는다", () => {
  Object.defineProperty(performance, "getEntriesByType", {
    configurable: true,
    value: undefined,
  });
  expect(isReloadNavigation()).toBe(false);
});

test.each([
  true,
  false,
])("브라우저 Request keepalive 지원 여부 %s를 전달한다", (supported) => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "Request");
  const RequestStub = class {};
  if (supported)
    Object.defineProperty(RequestStub.prototype, "keepalive", { value: false });
  Object.defineProperty(globalThis, "Request", {
    configurable: true,
    value: RequestStub,
  });
  try {
    expect(supportsAnalyticsKeepalive()).toBe(supported);
  } finally {
    if (original) Object.defineProperty(globalThis, "Request", original);
    else Reflect.deleteProperty(globalThis, "Request");
  }
});

test("다른 탭에서 바꾼 수집 설정만 받아 적용하고, 저장소를 비운 신호는 무시한다", () => {
  const apply = jest.fn();
  const stop = subscribeCollectingChanges(apply);
  const fire = (key: string | null, newValue: string | null) =>
    window.dispatchEvent(new StorageEvent("storage", { key, newValue }));
  fire("promise9_analytics_collecting", "false");
  fire("promise9_analytics_collecting", "true");
  fire("other_key", "false");
  fire(null, null);
  expect(apply.mock.calls).toEqual([[false], [true]]);
  stop();
  fire("promise9_analytics_collecting", "false");
  expect(apply).toHaveBeenCalledTimes(2);
});
