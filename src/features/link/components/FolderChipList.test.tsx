import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, userEvent } from "@testing-library/react-native";
import { Suspense } from "react";

// client.ts 는 import 시 EXPO_PUBLIC_API_BASE_URL 를 요구하므로 apiClient 만 mock 한다.
// 캐시를 직접 시딩해 queryFn 은 호출되지 않는다.
jest.mock("@shared/api", () => ({ apiClient: { get: jest.fn() } }));

const mockPush = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ push: mockPush }) }));

import { folderKeys } from "@shared/entities/folder/folder.keys";

import { FolderChipList } from "./FolderChipList";

const FOLDERS_RESPONSE = {
  systemFolders: {
    all: { linkCount: 3 },
    uncategorized: { linkCount: 1 },
    favorite: { linkCount: 0 },
    recentlyDeleted: { linkCount: 0 },
  },
  folders: [
    {
      folderId: 1,
      folderName: "디자인",
      color: "#d5d76a",
      linkCount: 2,
      lastSavedAt: null,
    },
    {
      folderId: 2,
      folderName: "개발",
      color: "#6a9fd7",
      linkCount: 1,
      lastSavedAt: null,
    },
  ],
};

const renderList = async (props: {
  value: number | null;
  onChange: jest.Mock;
}) => {
  const queryClient = new QueryClient();
  queryClient.setQueryData(folderKeys.list(), FOLDERS_RESPONSE);
  await render(
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={null}>
        <FolderChipList value={props.value} onChange={props.onChange} />
      </Suspense>
    </QueryClientProvider>,
  );
  return queryClient;
};

describe("FolderChipList", () => {
  it("미분류 + 폴더 순서대로 칩을 그린다", async () => {
    await renderList({ value: null, onChange: jest.fn() });
    expect(screen.getByText("미분류")).toBeTruthy();
    expect(screen.getByText("디자인")).toBeTruthy();
    expect(screen.getByText("개발")).toBeTruthy();
  });

  it("칩 탭 → onChange(folderId), 미분류 탭 → onChange(null)", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    await renderList({ value: null, onChange });
    await user.press(screen.getByText("디자인"));
    expect(onChange).toHaveBeenCalledWith(1);
    await user.press(screen.getByText("미분류"));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("'+' 탭 → 폴더 생성 라우트", async () => {
    const user = userEvent.setup();
    await renderList({ value: null, onChange: jest.fn() });
    await user.press(screen.getByRole("button", { name: "폴더 추가" }));
    expect(mockPush).toHaveBeenCalledWith("/create-folder");
  });

  it("새 폴더가 목록에 나타나면 자동 선택한다", async () => {
    const onChange = jest.fn();
    const queryClient = await renderList({ value: null, onChange });
    queryClient.setQueryData(folderKeys.list(), {
      ...FOLDERS_RESPONSE,
      folders: [
        ...FOLDERS_RESPONSE.folders,
        {
          folderId: 9,
          folderName: "새폴더",
          color: "#b282cc",
          linkCount: 0,
          lastSavedAt: null,
        },
      ],
    });
    await screen.findByText("새폴더");
    expect(onChange).toHaveBeenCalledWith(9);
  });
});
