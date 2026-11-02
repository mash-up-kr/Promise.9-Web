/** @jest-environment jsdom */
import { isReloadNavigation } from "./analytics.platform.web";

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
