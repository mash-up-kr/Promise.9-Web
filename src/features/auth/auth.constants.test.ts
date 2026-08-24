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
