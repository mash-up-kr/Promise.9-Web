import { NetworkError } from "@shared/api/errors";
import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  SaveScreen,
  type SaveScreenProps,
} from "@/sidepanel/screens/SaveScreen";
import { installChromeMock } from "@/test/chromeMock";
import { renderPanel } from "@/test/renderPanel";

const get = vi.fn();

vi.mock("@shared/api/client", () => ({
  apiClient: {
    get: (...args: unknown[]) => get(...args),
    post: vi.fn(),
  },
}));

const TAB = {
  url: "https://toss.tech/article/1",
  title: "제목",
  favIconUrl: undefined,
};

const renderSaveScreen = (overrides: Partial<SaveScreenProps> = {}) =>
  renderPanel(
    <SaveScreen
      tab={TAB}
      url={TAB.url}
      folderId={null}
      onFolderChange={vi.fn()}
      memo=""
      onMemoChange={vi.fn()}
      reminderAt={null}
      onReminderChange={vi.fn()}
      onPickDate={vi.fn()}
      onPickTime={vi.fn()}
      isSaving={false}
      onSave={vi.fn()}
      onCreateFolder={vi.fn()}
      {...overrides}
    />,
  );

beforeEach(() => {
  vi.clearAllMocks();
  installChromeMock({ tab: TAB });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("SaveScreen", () => {
  it("폴더를 못 불러와도 저장 화면은 살아 있고 다시 시도할 수 있다", async () => {
    // 폴더 조회가 실패해도 미분류로는 저장할 수 있어야 한다 — 팝업 전체가 죽으면 안 된다.
    get.mockRejectedValue(new NetworkError("네트워크 오류"));

    renderSaveScreen();

    expect(
      await screen.findByText(
        "폴더를 불러오지 못했어요. 미분류로 저장할 수 있어요.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "저장" })).toBeInTheDocument();
  });
});

describe("SaveScreen 리마인드", () => {
  it("지난 시각이면 저장하지 않고 안내한다", async () => {
    // 서버가 미래 시각만 받으므로(reminderAt refine) 요청을 보내기 전에 막는다.
    get.mockRejectedValue(
      new NetworkError("폴더 조회는 이 테스트의 관심사가 아니다"),
    );
    const onSave = vi.fn();
    const user = userEvent.setup();
    const past = new Date(Date.now() - 60 * 60 * 1000);

    renderSaveScreen({ reminderAt: past, onSave });
    await user.click(screen.getByRole("button", { name: "저장" }));

    expect(onSave).not.toHaveBeenCalled();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "선택한 시간이 이미 지났어요",
    );
  });

  it("미래 시각이면 ISO 8601 로 실어 보낸다", async () => {
    get.mockRejectedValue(
      new NetworkError("폴더 조회는 이 테스트의 관심사가 아니다"),
    );
    const onSave = vi.fn();
    const user = userEvent.setup();
    const future = new Date(Date.now() + 60 * 60 * 1000);

    renderSaveScreen({ reminderAt: future, onSave });
    await user.click(screen.getByRole("button", { name: "저장" }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ reminderAt: future.toISOString() }),
    );
  });
});
