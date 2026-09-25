import { normalizeLinkUrl } from "@shared/link/link.utils";

// iOS 공유 익스텐션 번들은 expo 를 import 하지 않아 전역 URL 이 RN 기본 구현으로 남는다.
const { URL: ReactNativeURL } = jest.requireActual(
  "react-native/Libraries/Blob/URL",
);

const originalURL = Object.getOwnPropertyDescriptor(globalThis, "URL");
const originalURLSearchParams = Object.getOwnPropertyDescriptor(
  globalThis,
  "URLSearchParams",
);

beforeEach(() => {
  Object.defineProperty(globalThis, "URL", {
    value: ReactNativeURL,
    configurable: true,
    writable: true,
  });
});

afterEach(() => {
  if (originalURL) Object.defineProperty(globalThis, "URL", originalURL);
  if (originalURLSearchParams) {
    Object.defineProperty(
      globalThis,
      "URLSearchParams",
      originalURLSearchParams,
    );
  }
});

test("RN 기본 URL 에서는 링크 검증이 서버(WHATWG)와 어긋난다", () => {
  expect(normalizeLinkUrl("http://example.com:99999").ok).toBe(true);
  expect(normalizeLinkUrl("tel:123#").ok).toBe(false);
});

test("설치하면 앱과 같은 WHATWG URL 로 검증한다", () => {
  jest.isolateModules(() => {
    require("./installWhatwgUrl");
  });

  expect(normalizeLinkUrl("http://example.com:99999")).toEqual({
    ok: false,
    reason: "not-link",
  });
  expect(normalizeLinkUrl("tel:123#")).toEqual({ ok: true, url: "tel:123#" });
  expect(new URLSearchParams("a=1&b=2").get("b")).toBe("2");
});
