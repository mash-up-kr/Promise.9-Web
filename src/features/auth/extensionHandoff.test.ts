import { EXTENSION_LOGIN_MESSAGE_SOURCE } from "@shared/extension/extensionLogin.contracts";

import { isExtensionReturn, sendIdTokenToExtension } from "./extensionHandoff";

const originalExtensionId = process.env.EXPO_PUBLIC_EXTENSION_ID;
const chromeGlobal = globalThis as { chrome?: unknown };

afterEach(() => {
  process.env.EXPO_PUBLIC_EXTENSION_ID = originalExtensionId;
  delete chromeGlobal.chrome;
});

describe("isExtensionReturn", () => {
  test("익스텐션이 붙인 값만 인정한다", () => {
    expect(isExtensionReturn("extension")).toBe(true);
    expect(isExtensionReturn("app")).toBe(false);
    expect(isExtensionReturn(undefined)).toBe(false);
  });
});

describe("sendIdTokenToExtension", () => {
  test("확장 ID 로 계약 모양의 메시지를 보내고 응답의 ok 를 돌려준다", async () => {
    process.env.EXPO_PUBLIC_EXTENSION_ID = "ext-id";
    const sendMessage = jest.fn().mockResolvedValue({ ok: true });
    chromeGlobal.chrome = { runtime: { sendMessage } };

    await expect(
      sendIdTokenToExtension({ provider: "google", idToken: "id-token" }),
    ).resolves.toBe(true);
    expect(sendMessage).toHaveBeenCalledWith("ext-id", {
      source: EXTENSION_LOGIN_MESSAGE_SOURCE,
      provider: "google",
      idToken: "id-token",
    });
  });

  // 익스텐션 미설치·다른 브라우저 — 웹 로그인은 평소처럼 진행돼야 하므로 던지지 않는다.
  test("chrome.runtime 이 없으면 조용히 false", async () => {
    process.env.EXPO_PUBLIC_EXTENSION_ID = "ext-id";

    await expect(
      sendIdTokenToExtension({ provider: "google", idToken: "id-token" }),
    ).resolves.toBe(false);
  });

  test("확장 ID 가 없으면 보내지 않는다", async () => {
    process.env.EXPO_PUBLIC_EXTENSION_ID = "";
    const sendMessage = jest.fn();
    chromeGlobal.chrome = { runtime: { sendMessage } };

    await expect(
      sendIdTokenToExtension({ provider: "google", idToken: "id-token" }),
    ).resolves.toBe(false);
    expect(sendMessage).not.toHaveBeenCalled();
  });

  test("익스텐션이 응답하지 않아도(throw) false 로 끝난다", async () => {
    process.env.EXPO_PUBLIC_EXTENSION_ID = "ext-id";
    chromeGlobal.chrome = {
      runtime: { sendMessage: jest.fn().mockRejectedValue(new Error("no")) },
    };

    await expect(
      sendIdTokenToExtension({ provider: "google", idToken: "id-token" }),
    ).resolves.toBe(false);
  });
});
