import { SOCIAL_PROVIDERS } from "./auth.constants";

describe("SOCIAL_PROVIDERS", () => {
  it("구글·카카오는 플랫폼과 무관하게 활성이다", () => {
    expect(SOCIAL_PROVIDERS.google.enabled).toBe(true);
    expect(SOCIAL_PROVIDERS.kakao.enabled).toBe(true);
  });

  it("세 provider 모두 라벨을 가진다(시안 노출 순서: 카카오→구글→애플)", () => {
    expect(Object.keys(SOCIAL_PROVIDERS)).toEqual(["kakao", "google", "apple"]);
  });
});

// apple.enabled 는 Platform.OS 로 모듈 로드 시점에 결정된다(platform.constants 경유).
// 케이스마다 모듈 레지스트리를 초기화하고 react-native mock 을 갈아끼운 뒤 새로 require 한다.
function loadProviders(os: string) {
  jest.resetModules();
  jest.doMock("react-native", () => ({ Platform: { OS: os } }));
  return (require("./auth.constants") as typeof import("./auth.constants"))
    .SOCIAL_PROVIDERS;
}

describe("SOCIAL_PROVIDERS.apple (플랫폼 분기)", () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock("react-native");
  });

  it("iOS 에선 애플이 활성이다", () => {
    expect(loadProviders("ios").apple.enabled).toBe(true);
  });

  it("웹에선 애플이 비활성이다", () => {
    expect(loadProviders("web").apple.enabled).toBe(false);
  });

  it("안드로이드에선 애플이 비활성이다", () => {
    expect(loadProviders("android").apple.enabled).toBe(false);
  });
});
