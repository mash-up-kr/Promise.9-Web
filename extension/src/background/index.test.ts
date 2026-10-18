import { beforeEach, describe, expect, it, vi } from "vitest";

import { MESSAGE_TYPE, type SaveLinkPayload } from "@/lib/messages";
import { installChromeMock } from "@/test/chromeMock";

const createLink = vi.fn();
vi.mock("@shared/entities/link/link.queries", () => ({
  createLink: (...args: unknown[]) => createLink(...args),
}));

const PAYLOAD: SaveLinkPayload = {
  url: "https://toss.tech/article/1",
  folderId: null,
  memo: null,
  reminderAt: null,
};

/** background 는 import 시점에 리스너를 등록한다 — chrome 스텁을 깐 뒤에 불러온다. */
async function loadBackground(): Promise<void> {
  vi.resetModules();
  await import("./index");
}

/** 대기 중인 promise 들을 진행시킨다. */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("navigator", { locks: { request: vi.fn() } });
});

describe("background 저장", () => {
  // Enter 를 누르고 있거나 두 번 누르면 같은 메시지가 연달아 온다. 그대로 두면 두 번째 요청이
  // 서버의 "이미 저장됨" 응답을 받아, 먼저 끝난 성공 기록을 중복 실패로 덮어쓴다.
  it("저장이 도는 동안 들어온 같은 요청은 무시한다", async () => {
    const chromeMock = installChromeMock();
    createLink.mockReturnValue(new Promise(() => {}));
    await loadBackground();

    chromeMock.emitMessage({ type: MESSAGE_TYPE.saveLink, payload: PAYLOAD });
    chromeMock.emitMessage({ type: MESSAGE_TYPE.saveLink, payload: PAYLOAD });
    await flush();

    expect(createLink).toHaveBeenCalledTimes(1);
  });

  it("저장이 끝나면 다음 요청을 받는다", async () => {
    const chromeMock = installChromeMock();
    createLink.mockResolvedValue({ linkId: 1 });
    await loadBackground();

    chromeMock.emitMessage({ type: MESSAGE_TYPE.saveLink, payload: PAYLOAD });
    await flush();
    chromeMock.emitMessage({ type: MESSAGE_TYPE.saveLink, payload: PAYLOAD });
    await flush();

    expect(createLink).toHaveBeenCalledTimes(2);
  });
});

describe("background 툴바 메뉴", () => {
  // 이름 항목은 Chrome 이 homepage_url(웹 홈)로 연결하므로 보관함만 더한다.
  it("설치 시 아이콘 우클릭 메뉴에 보관함 열기를 등록한다", async () => {
    const chromeMock = installChromeMock();
    await loadBackground();

    chromeMock.emitInstalled();

    expect(chromeMock.createContextMenu).toHaveBeenCalledWith({
      id: "open-archive",
      title: "보관함 열기",
      contexts: ["action"],
    });
  });

  it("보관함 열기를 누르면 웹앱 보관함을 새 탭으로 연다", async () => {
    const chromeMock = installChromeMock();
    await loadBackground();

    chromeMock.emitContextMenuClick("open-archive");

    expect(chromeMock.createTab).toHaveBeenCalledWith({
      url: "https://link-ding-dong.com/archive",
    });
  });

  it("다른 메뉴 항목 클릭에는 반응하지 않는다", async () => {
    const chromeMock = installChromeMock();
    await loadBackground();

    chromeMock.emitContextMenuClick("something-else");

    expect(chromeMock.createTab).not.toHaveBeenCalled();
  });
});
