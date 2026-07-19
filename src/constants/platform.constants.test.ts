interface PlatformFlags {
  isIOS: boolean;
  isAndroid: boolean;
  isWeb: boolean;
  isServer: boolean;
}

// window 은 dom lib 에서 `Window & typeof globalThis` 로 고정돼 있어 {}/undefined 대입이
// 막힌다. 테스트에선 존재 여부만 흉내내면 되므로 unknown 경유로 느슨하게 캐스팅한다.
const globalWithWindow = globalThis as unknown as { window?: unknown };
const originalWindow = globalWithWindow.window;

// Platform.OS 와 window 는 모듈 로드 시점에 평가되므로, 케이스마다 모듈 레지스트리를
// 초기화하고 react-native mock 과 window 를 갈아끼운 뒤 새로 require 한다.
function loadPlatform(os: string, hasWindow: boolean): PlatformFlags {
  jest.resetModules();
  jest.doMock("react-native", () => ({ Platform: { OS: os } }));
  globalWithWindow.window = hasWindow ? {} : undefined;

  return require("./platform.constants") as PlatformFlags;
}

describe("platform 상수", () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock("react-native");
    globalWithWindow.window = originalWindow;
  });

  test("ios 에서는 isIOS 만 true", () => {
    const { isIOS, isAndroid, isWeb, isServer } = loadPlatform("ios", true);

    expect(isIOS).toBe(true);
    expect(isAndroid).toBe(false);
    expect(isWeb).toBe(false);
    expect(isServer).toBe(false);
  });

  test("android 에서는 isAndroid 만 true", () => {
    const { isIOS, isAndroid, isWeb, isServer } = loadPlatform("android", true);

    expect(isAndroid).toBe(true);
    expect(isIOS).toBe(false);
    expect(isWeb).toBe(false);
    expect(isServer).toBe(false);
  });

  test("web + window 있으면 isWeb true · isServer false (브라우저)", () => {
    const { isIOS, isAndroid, isWeb, isServer } = loadPlatform("web", true);

    expect(isWeb).toBe(true);
    expect(isServer).toBe(false);
    expect(isIOS).toBe(false);
    expect(isAndroid).toBe(false);
  });

  test("web + window 없으면 isServer true (SSG 프리렌더)", () => {
    const { isWeb, isServer } = loadPlatform("web", false);

    expect(isWeb).toBe(true);
    expect(isServer).toBe(true);
  });
});
