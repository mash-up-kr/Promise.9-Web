// client.ts 는 import 시 EXPO_PUBLIC_API_BASE_URL 를 요구하므로 apiClient 만 mock 하고
// 나머지(토큰 저장소·contracts)는 실제 구현을 쓴다. refreshAccessToken 도 네트워크라 mock.
jest.mock("@shared/api", () => {
  const errors = jest.requireActual("@shared/api/errors");
  const token = jest.requireActual("@shared/api/token");
  const contracts = jest.requireActual("@shared/api/auth.contracts");
  return {
    apiClient: { post: jest.fn() },
    refreshAccessToken: jest.fn(),
    ...errors,
    ...token,
    ...contracts,
  };
});

import { apiClient, refreshAccessToken, setAccessToken } from "@shared/api";
import { EXTENSION_LOGIN_MESSAGE_SOURCE } from "@shared/extension/extensionLogin.contracts";

import {
  canConnectExtension,
  connectExtension,
  isExtensionReturn,
} from "./extensionHandoff";

const mockPost = apiClient.post as jest.Mock;
const mockRefresh = refreshAccessToken as jest.Mock;

const originalExtensionId = process.env.EXPO_PUBLIC_EXTENSION_ID;
const chromeGlobal = globalThis as { chrome?: unknown };

const tokenPairResponse = {
  data: {
    success: true,
    data: { accessToken: "ext-at", refreshToken: "ext-rt" },
  },
};

beforeEach(() => {
  mockPost.mockReset().mockResolvedValue(tokenPairResponse);
  mockRefresh.mockReset().mockResolvedValue("web-at");
  setAccessToken("web-at");
});

afterEach(() => {
  process.env.EXPO_PUBLIC_EXTENSION_ID = originalExtensionId;
  setAccessToken(null);
  delete chromeGlobal.chrome;
});

describe("isExtensionReturn", () => {
  test("익스텐션이 붙인 값만 인정한다", () => {
    expect(isExtensionReturn("extension")).toBe(true);
    expect(isExtensionReturn("app")).toBe(false);
    expect(isExtensionReturn(undefined)).toBe(false);
  });
});

describe("canConnectExtension", () => {
  test("확장 ID 와 chrome.runtime 이 둘 다 있어야 연결을 시도할 수 있다", () => {
    process.env.EXPO_PUBLIC_EXTENSION_ID = "ext-id";
    chromeGlobal.chrome = { runtime: { sendMessage: jest.fn() } };
    expect(canConnectExtension()).toBe(true);

    delete chromeGlobal.chrome;
    expect(canConnectExtension()).toBe(false);

    chromeGlobal.chrome = { runtime: { sendMessage: jest.fn() } };
    process.env.EXPO_PUBLIC_EXTENSION_ID = "";
    expect(canConnectExtension()).toBe(false);
  });
});

describe("connectExtension", () => {
  test("익스텐션용 토큰쌍을 발급받아 계약 모양의 메시지로 보낸다", async () => {
    process.env.EXPO_PUBLIC_EXTENSION_ID = "ext-id";
    const sendMessage = jest.fn().mockResolvedValue({ ok: true });
    chromeGlobal.chrome = { runtime: { sendMessage } };

    await expect(connectExtension()).resolves.toEqual({ ok: true });
    expect(mockPost).toHaveBeenCalledWith("/auth/extension-token");
    expect(sendMessage).toHaveBeenCalledWith("ext-id", {
      source: EXTENSION_LOGIN_MESSAGE_SOURCE,
      accessToken: "ext-at",
      refreshToken: "ext-rt",
    });
    // 메모리에 액세스 토큰이 이미 있으면 재발급하지 않는다.
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  // 익스텐션이 새로 연 탭은 메모리가 비어 있다(액세스 토큰은 메모리 전용).
  // /auth/* 는 401 자동 재발급 대상이 아니므로 여기서 직접 복원해야 한다.
  test("액세스 토큰이 없으면 리프레시로 복원한 뒤 발급한다", async () => {
    process.env.EXPO_PUBLIC_EXTENSION_ID = "ext-id";
    chromeGlobal.chrome = {
      runtime: { sendMessage: jest.fn().mockResolvedValue({ ok: true }) },
    };
    setAccessToken(null);

    await expect(connectExtension()).resolves.toEqual({ ok: true });
    expect(mockRefresh).toHaveBeenCalled();
    expect(mockPost).toHaveBeenCalledWith("/auth/extension-token");
  });

  // 익스텐션 미설치·다른 브라우저 — 전달할 곳이 없는 토큰쌍을 발급하면 안 된다.
  test("chrome.runtime 이 없으면 토큰쌍을 발급하지 않는다", async () => {
    process.env.EXPO_PUBLIC_EXTENSION_ID = "ext-id";

    await expect(connectExtension()).resolves.toEqual({
      ok: false,
      reason: "unsupported",
    });
    expect(mockPost).not.toHaveBeenCalled();
  });

  test("확장 ID 가 없으면 토큰쌍을 발급하지 않는다", async () => {
    process.env.EXPO_PUBLIC_EXTENSION_ID = "";
    const sendMessage = jest.fn();
    chromeGlobal.chrome = { runtime: { sendMessage } };

    await expect(connectExtension()).resolves.toEqual({
      ok: false,
      reason: "unsupported",
    });
    expect(mockPost).not.toHaveBeenCalled();
    expect(sendMessage).not.toHaveBeenCalled();
  });

  test("발급 요청이 실패하면 실패로 끝난다", async () => {
    process.env.EXPO_PUBLIC_EXTENSION_ID = "ext-id";
    chromeGlobal.chrome = { runtime: { sendMessage: jest.fn() } };
    mockPost.mockRejectedValue(new Error("network"));

    await expect(connectExtension()).resolves.toEqual({
      ok: false,
      reason: "failed",
    });
  });

  // 웹 세션이 만료·폐기된 경우 — 재시도해봐야 같은 결과라, 다시 로그인시켜야 한다.
  test("웹 세션을 복원할 수 없으면 미인증으로 알린다", async () => {
    process.env.EXPO_PUBLIC_EXTENSION_ID = "ext-id";
    chromeGlobal.chrome = { runtime: { sendMessage: jest.fn() } };
    setAccessToken(null);
    mockRefresh.mockRejectedValue(new Error("401"));

    await expect(connectExtension()).resolves.toEqual({
      ok: false,
      reason: "unauthenticated",
    });
    expect(mockPost).not.toHaveBeenCalled();
  });

  // 발급만 되고 전달되지 않은 토큰쌍은 아무도 쓰지 않는다 — 폐기하지 않으면 재시도할 때마다
  // 살아 있는 리프레시 토큰이 서버에 쌓인다.
  test("인계에 실패하면 발급받은 토큰쌍을 폐기한다", async () => {
    process.env.EXPO_PUBLIC_EXTENSION_ID = "ext-id";
    chromeGlobal.chrome = {
      runtime: { sendMessage: jest.fn().mockResolvedValue({ ok: false }) },
    };

    await expect(connectExtension()).resolves.toEqual({
      ok: false,
      reason: "failed",
    });
    expect(mockPost).toHaveBeenCalledWith("/auth/logout", {
      refreshToken: "ext-rt",
    });
  });

  test("익스텐션이 응답하지 않아도(throw) 토큰쌍을 폐기하고 끝난다", async () => {
    process.env.EXPO_PUBLIC_EXTENSION_ID = "ext-id";
    chromeGlobal.chrome = {
      runtime: { sendMessage: jest.fn().mockRejectedValue(new Error("no")) },
    };

    await expect(connectExtension()).resolves.toEqual({
      ok: false,
      reason: "failed",
    });
    expect(mockPost).toHaveBeenCalledWith("/auth/logout", {
      refreshToken: "ext-rt",
    });
  });
});
