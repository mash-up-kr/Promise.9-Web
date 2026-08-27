import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installTokenPersistence } from "@/lib/auth/session";
import { MESSAGE_TYPE } from "@/lib/messages";
import type { SaveRecord } from "@/lib/storage";
import { SidePanelApp } from "@/sidepanel/SidePanelApp";
import { installChromeMock } from "@/test/chromeMock";
import { renderPanel } from "@/test/renderPanel";

const SAVABLE_TAB = {
  url: "https://toss.tech/article/50893",
  title: "신입 디자이너가 알아야 할 실험 설계 팁",
  favIconUrl: "https://toss.tech/favicon.ico",
};

// 폴더 목록은 서버 호출이라 매 테스트에서 mock 한다. 실제 백엔드는 부르지 않는다.
const folderListResponse = {
  success: true,
  data: {
    systemFolders: {
      all: { linkCount: 0 },
      uncategorized: { linkCount: 0 },
      favorite: { linkCount: 0 },
      recentlyDeleted: { linkCount: 0 },
    },
    folders: [
      {
        folderId: 3,
        folderName: "디자인",
        color: "#61a8ef",
        linkCount: 2,
        lastSavedAt: null,
      },
    ],
  },
};

vi.mock("@shared/api/client", () => ({
  apiClient: {
    get: vi.fn(async () => ({ data: folderListResponse })),
    post: vi.fn(async () => ({ data: { success: true, data: {} } })),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  // 프로덕션에선 진입점(main.tsx)이 붙인다 — 테스트도 같은 저장소를 쓰게 맞춘다.
  installTokenPersistence();
});

afterEach(() => {
  // 언마운트가 chrome 스텁을 아직 필요로 한다(storage 구독 해제) — 먼저 정리하고 스텁을 걷는다.
  cleanup();
  vi.unstubAllGlobals();
});

describe("SidePanelApp", () => {
  it("저장할 수 없는 페이지면 안내 화면을 보여준다", async () => {
    installChromeMock({ tab: { url: "chrome://extensions", title: "확장" } });

    renderPanel(<SidePanelApp />);

    expect(
      await screen.findByText("이 페이지는 저장할 수 없어요"),
    ).toBeInTheDocument();
  });

  it("로그인 전이면 로그인 화면을 보여준다", async () => {
    installChromeMock({ tab: SAVABLE_TAB });

    renderPanel(<SidePanelApp />);

    expect(await screen.findByText("로그인을 해주세요")).toBeInTheDocument();
  });

  it("로그인 후에는 활성 탭 제목이 채워진 저장 화면을 보여준다", async () => {
    installChromeMock({
      tab: SAVABLE_TAB,
      local: { refreshToken: "stored-refresh-token" },
    });

    renderPanel(<SidePanelApp />);

    // 탭 정보는 chrome 이 이미 아는 값이라 서버를 기다리지 않고 바로 뜬다.
    expect(await screen.findByText(SAVABLE_TAB.title)).toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: "디자인" }),
    ).toBeInTheDocument();
  });

  it("저장을 누르면 선택한 폴더·메모로 background 에 저장을 요청한다", async () => {
    const chromeMock = installChromeMock({
      tab: SAVABLE_TAB,
      local: { refreshToken: "stored-refresh-token" },
    });
    const user = userEvent.setup();

    renderPanel(<SidePanelApp />);

    await user.click(await screen.findByRole("button", { name: "디자인" }));
    await user.type(screen.getByLabelText("메모"), "회의 전에 다시 보기");
    await user.click(screen.getByRole("button", { name: "저장" }));

    expect(chromeMock.sendMessage).toHaveBeenCalledWith({
      type: MESSAGE_TYPE.saveLink,
      payload: {
        url: SAVABLE_TAB.url,
        folderId: 3,
        memo: "회의 전에 다시 보기",
        // 리마인드를 켜지 않았으면 null 로 보낸다.
        reminderAt: null,
      },
    });
  });

  it("리마인드를 켜면 기본값이 내일 오전 9시이고, 그대로 저장된다", async () => {
    const chromeMock = installChromeMock({
      tab: SAVABLE_TAB,
      local: { refreshToken: "stored-refresh-token" },
    });
    const user = userEvent.setup();

    renderPanel(<SidePanelApp />);
    await screen.findByText(SAVABLE_TAB.title);

    await user.click(screen.getByRole("switch", { name: "리마인드" }));
    // 시안 기본값 — '내일' 프리셋이 선택된 상태로 켜진다.
    expect(screen.getByRole("button", { name: "내일" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("오전 9:00")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "저장" }));

    const [[message]] = chromeMock.sendMessage.mock.calls as [
      [{ payload: { reminderAt: string | null } }],
    ];
    const sent = message.payload.reminderAt;
    // 서버가 받는 형식: 타임존을 포함한 ISO 8601.
    expect(sent).not.toBeNull();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(new Date(sent as string).getHours()).toBe(9);
    expect(new Date(sent as string).getDate()).toBe(tomorrow.getDate());
  });

  it("리마인드를 끄면 reminderAt 없이 저장한다", async () => {
    const chromeMock = installChromeMock({
      tab: SAVABLE_TAB,
      local: { refreshToken: "stored-refresh-token" },
    });
    const user = userEvent.setup();

    renderPanel(<SidePanelApp />);
    await screen.findByText(SAVABLE_TAB.title);

    const toggle = screen.getByRole("switch", { name: "리마인드" });
    await user.click(toggle);
    await user.click(toggle);
    await user.click(screen.getByRole("button", { name: "저장" }));

    expect(chromeMock.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ reminderAt: null }),
      }),
    );
  });

  it("background 가 저장을 끝내면 결과 화면으로 바뀐다", async () => {
    const chromeMock = installChromeMock({
      tab: SAVABLE_TAB,
      local: { refreshToken: "stored-refresh-token" },
    });

    renderPanel(<SidePanelApp />);
    await screen.findByText(SAVABLE_TAB.title);

    const record: SaveRecord = {
      session: {
        url: SAVABLE_TAB.url,
        phase: "success",
        linkId: 42,
        failureCount: 0,
      },
      request: {
        url: SAVABLE_TAB.url,
        folderId: null,
        memo: null,
        reminderAt: null,
      },
    };
    chromeMock.emitSessionChange("save", record);

    await waitFor(() => {
      expect(screen.getByText("링크 저장을 완료했어요")).toBeInTheDocument();
    });
  });

  it("팝업이 닫혔다 열려도 마지막 저장 결과를 그대로 보여준다", async () => {
    // 저장 도중 팝업을 닫아도 background 가 결과를 storage 에 남긴다 — 다시 열면 그걸 읽는다.
    installChromeMock({
      tab: SAVABLE_TAB,
      local: { refreshToken: "stored-refresh-token" },
      session: {
        save: {
          session: {
            url: SAVABLE_TAB.url,
            phase: "duplicate",
            linkId: null,
            failureCount: 0,
          },
          request: {
            url: SAVABLE_TAB.url,
            folderId: null,
            memo: null,
            reminderAt: null,
          },
        } satisfies SaveRecord,
      },
    });

    renderPanel(<SidePanelApp />);

    expect(await screen.findByText("이미 저장된 링크예요")).toBeInTheDocument();
  });

  it("저장 성공 후 '링크 보러가기' 는 웹앱의 그 링크를 새 탭으로 연다", async () => {
    const chromeMock = installChromeMock({
      tab: SAVABLE_TAB,
      local: { refreshToken: "stored-refresh-token" },
      session: {
        save: {
          session: {
            url: SAVABLE_TAB.url,
            phase: "success",
            linkId: 42,
            failureCount: 0,
          },
          request: {
            url: SAVABLE_TAB.url,
            folderId: null,
            memo: null,
            reminderAt: null,
          },
        } satisfies SaveRecord,
      },
    });
    const user = userEvent.setup();

    renderPanel(<SidePanelApp />);
    await user.click(
      await screen.findByRole("button", { name: "링크 보러가기" }),
    );

    expect(chromeMock.createTab).toHaveBeenCalledWith({
      url: "https://link-ding-dong.com/link/42",
    });
  });

  it("탭을 옮기면 저장 대상도 따라가고, 적던 메모는 버린다", async () => {
    // 사이드바는 열린 채 남아 있어서, 대상이 안 따라가면 엉뚱한 링크를 저장하게 된다.
    const chromeMock = installChromeMock({
      tab: SAVABLE_TAB,
      local: { refreshToken: "stored-refresh-token" },
    });
    const user = userEvent.setup();

    renderPanel(<SidePanelApp />);
    await screen.findByText(SAVABLE_TAB.title);
    await user.type(screen.getByLabelText("메모"), "이전 링크에 적던 메모");

    const nextTab = {
      url: "https://toss.tech/article/99",
      title: "다음 글",
      favIconUrl: undefined,
    };
    chromeMock.setActiveTab(nextTab);
    chromeMock.emitTabActivated();

    expect(await screen.findByText(nextTab.title)).toBeInTheDocument();
    expect(screen.getByLabelText("메모")).toHaveValue("");
  });

  it("저장할 수 없는 탭으로 옮기면 안내로 바뀐다", async () => {
    const chromeMock = installChromeMock({
      tab: SAVABLE_TAB,
      local: { refreshToken: "stored-refresh-token" },
    });

    renderPanel(<SidePanelApp />);
    await screen.findByText(SAVABLE_TAB.title);

    chromeMock.setActiveTab({ url: "chrome://extensions", title: "확장" });
    chromeMock.emitTabActivated();

    expect(
      await screen.findByText("이 페이지는 저장할 수 없어요"),
    ).toBeInTheDocument();
  });

  it("다른 탭에서 만든 저장 결과는 따라오지 않는다", async () => {
    installChromeMock({
      tab: SAVABLE_TAB,
      local: { refreshToken: "stored-refresh-token" },
      session: {
        save: {
          session: {
            url: "https://example.com/other",
            phase: "success",
            linkId: 7,
            failureCount: 0,
          },
          request: {
            url: "https://example.com/other",
            folderId: null,
            memo: null,
            reminderAt: null,
          },
        } satisfies SaveRecord,
      },
    });

    renderPanel(<SidePanelApp />);

    expect(await screen.findByText(SAVABLE_TAB.title)).toBeInTheDocument();
    expect(
      screen.queryByText("링크 저장을 완료했어요"),
    ).not.toBeInTheDocument();
  });
});
