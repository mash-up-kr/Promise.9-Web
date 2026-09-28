import { normalizeLinkUrl } from "@shared/link/link.utils";

// iOS 공유 익스텐션 번들은 expo 를 import 하지 않아 전역 URL 이 RN 기본 구현으로 남는다.
const { URL: ReactNativeURL } = jest.requireActual(
  "react-native/Libraries/Blob/URL",
);

const originalGlobals = ["URL", "URLSearchParams", "TextDecoder"].map(
  (name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)] as const,
);

beforeEach(() => {
  Object.defineProperty(globalThis, "URL", {
    value: ReactNativeURL,
    configurable: true,
    writable: true,
  });
});

afterEach(() => {
  for (const [name, descriptor] of originalGlobals) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
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

// 익스텐션의 Hermes 엔 TextEncoder 만 있고 TextDecoder 가 없다 — whatwg-url-minimum 은 불러올 때 둘 다 만든다.
test("TextDecoder 가 없는 런타임에서도 URL 을 쓸 수 있다", () => {
  Reflect.deleteProperty(globalThis, "TextDecoder");

  jest.isolateModules(() => {
    require("./installWhatwgUrl");

    expect(new URL("https://toss.tech/a").href).toBe("https://toss.tech/a");
    expect(() => new URL("http://example.com:99999")).toThrow(TypeError);
  });
});
