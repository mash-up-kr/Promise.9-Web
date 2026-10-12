import { Linking } from "react-native";

import { openExternalUrl } from "./openExternalUrl";

describe("openExternalUrl", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    // jest 환경의 Linking.openURL 은 이미 목이라 spyOn 이 같은 함수를 돌려준다 — 호출 기록을 따로 비운다.
    jest.clearAllMocks();
  });

  test("전달한 URL 로 Linking.openURL 을 호출한다", async () => {
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);

    await expect(openExternalUrl("https://toss.tech")).resolves.toBe("opened");

    expect(openURL).toHaveBeenCalledWith("https://toss.tech");
  });

  test("앱 전용 스킴 링크도 연다", async () => {
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);

    await openExternalUrl("nmap://place?id=123");

    expect(openURL).toHaveBeenCalledWith("nmap://place?id=123");
  });

  // 저장 규칙이 바뀌기 전에 저장된 링크도 열려야 한다 — 열 때는 저장 규칙을 다시 적용하지 않는다.
  test("예전에 저장된 공백 포함 주소도 연다", async () => {
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);

    await openExternalUrl("https://www.google.com/search?q=hello world");

    expect(openURL).toHaveBeenCalledWith(
      "https://www.google.com/search?q=hello world",
    );
  });

  // 서버에는 다른 경로로 저장된 URL 도 있을 수 있다 — 저장 검증과 별개로 열기 직전에 한 번 더 막는다.
  test("위험한 스킴 링크는 열지 않는다", async () => {
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
    jest.spyOn(console, "warn").mockImplementation(() => {});

    await expect(openExternalUrl("javascript:alert(1)")).resolves.toBe(
      "blocked",
    );

    expect(openURL).not.toHaveBeenCalled();
  });

  test("열기에 실패해도 예외를 던지지 않고 실패로 알린다", async () => {
    jest.spyOn(Linking, "openURL").mockRejectedValue(new Error("cannot open"));
    // 실패는 개발 로깅만 — 콘솔 경고를 눌러 테스트 출력이 지저분해지지 않게 한다.
    jest.spyOn(console, "warn").mockImplementation(() => {});

    await expect(openExternalUrl("https://toss.tech")).resolves.toBe("failed");
  });
});
