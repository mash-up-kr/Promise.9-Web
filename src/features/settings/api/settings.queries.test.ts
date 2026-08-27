// client.ts 는 import 시 EXPO_PUBLIC_API_BASE_URL 를 요구하므로 apiClient 만 mock 한다.
jest.mock("@shared/api", () => ({
  apiClient: { get: jest.fn(), post: jest.fn() },
}));

import { settingsQueries, userProfileSchema } from "./settings.queries";

describe("userProfileSchema", () => {
  it("email 을 파싱하고 나머지 필드는 통과시킨다", () => {
    expect(
      userProfileSchema.parse({
        userId: 1,
        email: "me@x.com",
        provider: "google",
      }),
    ).toEqual({ userId: 1, email: "me@x.com", provider: "google" });
  });

  it("email 이 없으면 던진다", () => {
    expect(() => userProfileSchema.parse({ userId: 1 })).toThrow();
  });
});

describe("settingsQueries.profile", () => {
  it("select 로 email 만 뽑는다", () => {
    const { select } = settingsQueries.profile();
    expect(select?.({ email: "me@x.com" })).toBe("me@x.com");
  });

  it("queryKey 는 settings/profile 이다", () => {
    expect(settingsQueries.profile().queryKey).toEqual(["settings", "profile"]);
  });
});
