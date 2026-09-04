import { ApiError } from "@shared/api/errors";
import { FOLDER_ERROR_CODE } from "@shared/entities/folder/folder.errors";
import { FOLDER_NAME_MAX_LENGTH } from "@shared/folder/folder.contracts";
import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AxiosResponse } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NewFolderScreen } from "@/sidepanel/screens/NewFolderScreen";
import { renderPanel } from "@/test/renderPanel";

const post = vi.fn();

vi.mock("@shared/api/client", () => ({
  apiClient: {
    get: vi.fn(),
    post: (...args: unknown[]) => post(...args),
  },
}));

const duplicateNameError = new ApiError({
  status: 409,
  data: {
    success: false,
    error: {
      code: 409,
      errorCode: FOLDER_ERROR_CODE.DUPLICATE_NAME,
      message: "이미 존재하는 폴더 이름입니다.",
      timestamp: "2026-07-26T00:00:00.000Z",
    },
  },
} as unknown as AxiosResponse);

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(cleanup);

describe("NewFolderScreen", () => {
  it("이름이 비어 있으면 저장할 수 없다", async () => {
    renderPanel(<NewFolderScreen onCancel={vi.fn()} onCreated={vi.fn()} />);

    expect(screen.getByRole("button", { name: "저장" })).toBeDisabled();
  });

  // 길이 규칙은 앱·웹의 폼과 같은 스키마(shared/folder/folder.contracts)를 쓴다 —
  // 여기서만 긴 이름을 보내면 웹의 폼으로는 고칠 수 없는 폴더가 만들어진다.
  it("폴더 이름은 최대 길이까지만 입력받는다", async () => {
    const user = userEvent.setup();

    renderPanel(<NewFolderScreen onCancel={vi.fn()} onCreated={vi.fn()} />);

    const input = screen.getByPlaceholderText("새 폴더");
    await user.type(input, "가".repeat(FOLDER_NAME_MAX_LENGTH + 5));

    expect(input).toHaveValue("가".repeat(FOLDER_NAME_MAX_LENGTH));
  });

  it("이름과 색을 골라 만들고, 만들어진 폴더 id 를 돌려준다", async () => {
    post.mockResolvedValue({
      data: { success: true, data: { folderId: 9, folderName: "개발" } },
    });
    const onCreated = vi.fn();
    const user = userEvent.setup();

    renderPanel(<NewFolderScreen onCancel={vi.fn()} onCreated={onCreated} />);

    await user.type(screen.getByPlaceholderText("새 폴더"), "개발");
    await user.click(screen.getByRole("button", { name: "green" }));
    await user.click(screen.getByRole("button", { name: "저장" }));

    // tone 이 아니라 서버 팔레트 hex 로 나간다(엔티티가 변환).
    expect(post).toHaveBeenCalledWith("/folders", {
      folderName: "개발",
      color: "#50b094",
    });
    expect(onCreated).toHaveBeenCalledWith(9);
  });

  it("이름이 중복이면 그 사유를 알려준다", async () => {
    post.mockRejectedValue(duplicateNameError);
    const user = userEvent.setup();

    renderPanel(<NewFolderScreen onCancel={vi.fn()} onCreated={vi.fn()} />);

    await user.type(screen.getByPlaceholderText("새 폴더"), "디자인");
    await user.click(screen.getByRole("button", { name: "저장" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "이미 있는 폴더 이름이에요",
    );
  });
});
