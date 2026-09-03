import { EXTENSION_LOGIN_MESSAGE_SOURCE } from "@shared/extension/extensionLogin.contracts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { handleLoginHandoff } from "./handoff";

const logInWithTokens = vi.fn();
vi.mock("./session", () => ({
  logInWithTokens: (...args: unknown[]) => logInWithTokens(...args),
}));

const MESSAGE = {
  source: EXTENSION_LOGIN_MESSAGE_SOURCE,
  accessToken: "ext-at",
  refreshToken: "ext-rt",
};
const WEB_APP = "https://link-ding-dong.com/login?return=extension";

beforeEach(() => {
  logInWithTokens.mockReset().mockResolvedValue(undefined);
});

describe("handleLoginHandoff", () => {
  it("웹앱이 발급받아 보낸 토큰쌍으로 로그인한다", async () => {
    await expect(handleLoginHandoff(MESSAGE, WEB_APP)).resolves.toEqual({
      ok: true,
    });
    expect(logInWithTokens).toHaveBeenCalledWith("ext-at", "ext-rt");
  });

  // externally_connectable 이 도메인을 거르지만, 방어를 한 겹 더 둔다 — 토큰쌍은 곧 계정이다.
  it("웹앱 origin 이 아니면 토큰을 저장하지 않는다", async () => {
    const result = await handleLoginHandoff(
      MESSAGE,
      "https://evil.example/login",
    );

    expect(result.ok).toBe(false);
    expect(logInWithTokens).not.toHaveBeenCalled();
  });

  it("보낸 곳을 알 수 없으면 거부한다", async () => {
    const result = await handleLoginHandoff(MESSAGE, undefined);

    expect(result.ok).toBe(false);
    expect(logInWithTokens).not.toHaveBeenCalled();
  });

  // 응답을 못 보내면 웹앱 탭은 "연결 중" 인 채로 포트가 닫힐 때까지 수십 초를 기다린다.
  it("토큰 저장에 실패해도 실패로 응답한다", async () => {
    logInWithTokens.mockRejectedValue(new Error("storage 쓰기 실패"));

    const result = await handleLoginHandoff(MESSAGE, WEB_APP);

    expect(result.ok).toBe(false);
  });

  it("계약 모양이 아닌 메시지는 거부한다", async () => {
    const result = await handleLoginHandoff({ hello: "world" }, WEB_APP);

    expect(result.ok).toBe(false);
    expect(logInWithTokens).not.toHaveBeenCalled();
  });
});
