import { APP_STORE_URL, PLAY_STORE_URL } from "./appInstall.constants";
import { getMobileOS, getStoreUrl } from "./appInstall.utils";

const USER_AGENTS = {
  iPhone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  iPadLegacy:
    "Mozilla/5.0 (iPad; CPU OS 12_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
  android:
    "Mozilla/5.0 (Linux; Android 14; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
  kakaoInApp:
    "Mozilla/5.0 (Linux; Android 14; SM-S918N; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.0.0 Mobile Safari/537.36 KAKAOTALK 10.8.0",
  macChrome:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  windowsEdge:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0",
};

describe("getMobileOS", () => {
  test.each([
    ["iPhone", USER_AGENTS.iPhone, "ios"],
    ["iPad(구 UA)", USER_AGENTS.iPadLegacy, "ios"],
    ["Android", USER_AGENTS.android, "android"],
    ["Android 인앱 브라우저", USER_AGENTS.kakaoInApp, "android"],
    ["macOS 데스크톱", USER_AGENTS.macChrome, null],
    ["Windows 데스크톱", USER_AGENTS.windowsEdge, null],
    ["빈 값", "", null],
  ])("%s → %s", (_, userAgent, expected) => {
    expect(getMobileOS(userAgent)).toBe(expected);
  });
});

describe("getStoreUrl", () => {
  test("iOS 는 App Store 로 보낸다", () => {
    expect(getStoreUrl("ios")).toBe(APP_STORE_URL);
  });

  test("Android 는 Google Play 출시 전이면 안내 페이지(null)로 둔다", () => {
    expect(getStoreUrl("android", false)).toBeNull();
  });

  test("Android 는 Google Play 출시 후 Google Play 로 보낸다", () => {
    expect(getStoreUrl("android", true)).toBe(PLAY_STORE_URL);
  });

  test("판별할 수 없으면 안내 페이지(null)로 둔다", () => {
    expect(getStoreUrl(null, true)).toBeNull();
  });
});
