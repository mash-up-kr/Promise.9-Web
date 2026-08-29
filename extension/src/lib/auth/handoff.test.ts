import { EXTENSION_LOGIN_MESSAGE_SOURCE } from "@shared/extension/extensionLogin.contracts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { handleLoginHandoff } from "./handoff";

const logInWithIdToken = vi.fn();
vi.mock("./session", () => ({
  logInWithIdToken: (...args: unknown[]) => logInWithIdToken(...args),
}));

const MESSAGE = {
  source: EXTENSION_LOGIN_MESSAGE_SOURCE,
  provider: "google",
  idToken: "id-token",
};
const WEB_APP = "https://link-ding-dong.com/login?return=extension";

beforeEach(() => {
  logInWithIdToken.mockReset().mockResolvedValue(undefined);
});

describe("handleLoginHandoff", () => {
  it("웹앱이 보낸 idToken 으로 로그인한다", async () => {
    await expect(handleLoginHandoff(MESSAGE, WEB_APP)).resolves.toEqual({
      ok: true,
    });
    expect(logInWithIdToken).toHaveBeenCalledWith("google", "id-token");
  });

  // externally_connectable 이 도메인을 거르지만, 방어를 한 겹 더 둔다 — idToken 은 곧 계정이다.
  it("웹앱 origin 이 아니면 idToken 을 쓰지 않는다", async () => {
    const result = await handleLoginHandoff(
      MESSAGE,
      "https://evil.example/login",
    );

    expect(result.ok).toBe(false);
    expect(logInWithIdToken).not.toHaveBeenCalled();
  });

  it("보낸 곳을 알 수 없으면 거부한다", async () => {
    const result = await handleLoginHandoff(MESSAGE, undefined);

    expect(result.ok).toBe(false);
    expect(logInWithIdToken).not.toHaveBeenCalled();
  });

  it("계약 모양이 아닌 메시지는 거부한다", async () => {
    const result = await handleLoginHandoff({ hello: "world" }, WEB_APP);

    expect(result.ok).toBe(false);
    expect(logInWithIdToken).not.toHaveBeenCalled();
  });
});
