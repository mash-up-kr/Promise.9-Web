import { Linking } from "react-native";

import { openExternalUrl } from "./openExternalUrl";

describe("openExternalUrl", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("전달한 URL 로 Linking.openURL 을 호출한다", async () => {
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);

    await openExternalUrl("https://toss.tech");

    expect(openURL).toHaveBeenCalledWith("https://toss.tech");
  });

  test("열기에 실패해도 예외를 던지지 않고 삼킨다", async () => {
    jest.spyOn(Linking, "openURL").mockRejectedValue(new Error("cannot open"));
    // 실패는 개발 로깅만 — 콘솔 경고를 눌러 테스트 출력이 지저분해지지 않게 한다.
    jest.spyOn(console, "warn").mockImplementation(() => {});

    await expect(openExternalUrl("https://toss.tech")).resolves.toBeUndefined();
  });
});
