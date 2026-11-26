import { NetworkError } from "@shared/api/errors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  render as renderWithoutWrapper,
  screen,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SettingsScreen } from "@/sidepanel/screens/SettingsScreen";
import { renderPanel } from "@/test/renderPanel";

const get = vi.fn();
const patch = vi.fn();

vi.mock("@shared/api/client", () => ({
  apiClient: {
    get: (...args: unknown[]) => get(...args),
    patch: (...args: unknown[]) => patch(...args),
  },
}));

const APP_INSTALL_ROW = "앱 설치하고 푸시 알림 받기";
const SHEET_TITLE = "앱에서 푸시 알림을 받아보세요!";
const CHANNEL_CAPTION =
  "웹에서는 이메일로 알려드려요. 앱에서는 푸시 알림도 받을 수 있어요.";
const ALL_OFF_CAPTION =
  "알림이 모두 꺼져 있어서 리마인드를 알려드릴 수 없어요.";

const settings = (email: boolean) => ({
  data: { success: true, data: { email, push: true } },
});

const onSaveFailure = vi.fn();

const render = (onBack: () => void = () => {}) =>
  renderPanel(<SettingsScreen onBack={onBack} onSaveFailure={onSaveFailure} />);

const emailSwitch = () => screen.findByRole("switch", { name: "이메일 알림" });

beforeEach(() => {
  vi.clearAllMocks();
  get.mockResolvedValue(settings(true));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("SettingsScreen", () => {
  it("알림 섹션에 앱 설치 행과 알림 경로 안내를 보여준다", () => {
    render();

    expect(screen.getByRole("heading", { name: "설정" })).toBeInTheDocument();
    expect(screen.getByText("알림")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: APP_INSTALL_ROW }),
    ).toBeInTheDocument();
    expect(screen.getByText(CHANNEL_CAPTION)).toBeInTheDocument();
  });

  it("뒤로 가기를 누르면 onBack 을 부른다", async () => {
    const onBack = vi.fn();
    render(onBack);

    await userEvent.click(screen.getByRole("button", { name: "뒤로 가기" }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("앱 설치 행을 누르면 QR 과 짧은 주소가 담긴 시트를 연다", async () => {
    render();

    await userEvent.click(
      screen.getByRole("button", { name: APP_INSTALL_ROW }),
    );

    const sheet = screen.getByRole("dialog", { name: SHEET_TITLE });
    expect(sheet).toHaveTextContent("리마인드를 앱 알림으로 받을 수 있어요.");
    expect(screen.getByLabelText("앱 설치 QR 코드")).toBeInTheDocument();
    expect(screen.getByText("link-ding-dong.com/app")).toBeInTheDocument();
  });

  it("시트는 Escape 나 바깥(dim)을 눌러 닫는다", async () => {
    render();
    const openSheet = () =>
      userEvent.click(screen.getByRole("button", { name: APP_INSTALL_ROW }));

    await openSheet();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await openSheet();
    await userEvent.click(screen.getByRole("button", { name: "닫기" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("시트가 열린 동안 Tab·Shift+Tab 으로 포커스가 시트 밖으로 나가지 않는다", async () => {
    render();
    await userEvent.click(
      screen.getByRole("button", { name: APP_INSTALL_ROW }),
    );
    const sheet = screen.getByRole("dialog", { name: SHEET_TITLE });
    expect(sheet).toHaveFocus();

    await userEvent.tab();
    expect(sheet).toHaveFocus();

    await userEvent.tab({ shift: true });
    expect(sheet).toHaveFocus();
  });

  it("시트를 닫으면 포커스가 앱 설치 행으로 돌아간다", async () => {
    render();
    const row = screen.getByRole("button", { name: APP_INSTALL_ROW });

    await userEvent.click(row);
    await userEvent.keyboard("{Escape}");

    expect(row).toHaveFocus();
  });

  it("이메일 알림 스위치는 서버에 저장된 값을 보여준다", async () => {
    get.mockResolvedValue(settings(false));
    render();

    expect(await emailSwitch()).toHaveAttribute("aria-checked", "false");
    expect(get).toHaveBeenCalledWith("/users/me/notification-settings", {
      signal: expect.any(AbortSignal),
    });
  });

  it("누르면 바로 꺼지고 이메일 설정만 서버에 보낸다", async () => {
    patch.mockReturnValue(new Promise(() => {}));
    render();

    await userEvent.click(await emailSwitch());

    expect(await emailSwitch()).toHaveAttribute("aria-checked", "false");
    expect(patch).toHaveBeenCalledWith("/users/me/notification-settings", {
      email: false,
    });
  });

  it("저장 중에 다시 누른 것은 무시한다", async () => {
    patch.mockReturnValue(new Promise(() => {}));
    render();

    await userEvent.click(await emailSwitch());
    await userEvent.click(await emailSwitch());

    expect(patch).toHaveBeenCalledTimes(1);
    expect(await emailSwitch()).toHaveAttribute("aria-checked", "false");
  });

  it("저장에 실패하면 되돌리고 실패를 알린다", async () => {
    patch.mockRejectedValue(new Error("500"));
    render();

    await userEvent.click(await emailSwitch());

    await vi.waitFor(() =>
      expect(onSaveFailure).toHaveBeenCalledWith("failed"),
    );
    expect(await emailSwitch()).toHaveAttribute("aria-checked", "true");
  });

  it("오프라인이면 되돌리고 오프라인 실패로 알린다", async () => {
    patch.mockRejectedValue(new NetworkError());
    render();

    await userEvent.click(await emailSwitch());

    await vi.waitFor(() =>
      expect(onSaveFailure).toHaveBeenCalledWith("offline"),
    );
    expect(await emailSwitch()).toHaveAttribute("aria-checked", "true");
  });

  it("이메일 알림이 꺼져 있으면 안내 대신 리마인드를 받을 수 없다고 알린다", async () => {
    get.mockResolvedValue(settings(false));
    render();

    expect(await screen.findByText(ALL_OFF_CAPTION)).toBeInTheDocument();
    expect(screen.queryByText(CHANNEL_CAPTION)).toBeNull();
  });

  it("설정을 불러오지 못하면 다시 시도할 수 있다", async () => {
    get.mockRejectedValueOnce(new NetworkError());
    render();

    await userEvent.click(
      await screen.findByRole("button", { name: "다시 시도" }),
    );

    expect(await emailSwitch()).toHaveAttribute("aria-checked", "true");
    expect(
      screen.getByRole("button", { name: APP_INSTALL_ROW }),
    ).toBeInTheDocument();
  });

  it("설정 화면에 다시 들어오면 설정값을 다시 읽는다", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 0 } },
    });
    const view = (isOpen: boolean) => (
      <QueryClientProvider client={client}>
        {isOpen ? (
          <SettingsScreen onBack={() => {}} onSaveFailure={onSaveFailure} />
        ) : null}
      </QueryClientProvider>
    );
    const { rerender } = renderWithoutWrapper(view(true));
    await emailSwitch();

    rerender(view(false));
    get.mockResolvedValue(settings(false));
    // 서스펜스 쿼리는 받은 값을 최소 1초 동안 신선하게 본다 — 그보다 늦게 다시 들어온 상황.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(Date.now() + 2000);
    rerender(view(true));

    await vi.waitFor(async () =>
      expect(await emailSwitch()).toHaveAttribute("aria-checked", "false"),
    );
    expect(get).toHaveBeenCalledTimes(2);
  });
});
