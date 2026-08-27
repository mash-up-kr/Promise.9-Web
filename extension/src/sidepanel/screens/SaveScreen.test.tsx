import { NetworkError } from "@shared/api/errors";
import { cleanup, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SaveScreen } from "@/sidepanel/screens/SaveScreen";
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

const renderSaveScreen = () =>
  renderPanel(
    <SaveScreen
      tab={TAB}
      url={TAB.url}
      folderId={null}
      onFolderChange={vi.fn()}
      memo=""
      onMemoChange={vi.fn()}
      isSaving={false}
      onSave={vi.fn()}
      onCreateFolder={vi.fn()}
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
