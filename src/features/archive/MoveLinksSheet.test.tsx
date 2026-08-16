jest.mock("@shared/api", () => ({
  apiClient: { get: jest.fn(), patch: jest.fn() },
}));

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockCanGoBack = jest.fn(() => true);
const mockRouteParams: { current: { ids?: string; folderId?: string } } = {
  current: { ids: "42" },
};
jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockRouteParams.current,
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
    replace: mockReplace,
    canGoBack: mockCanGoBack,
  }),
}));

import { apiClient } from "@shared/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { type Metrics, SafeAreaProvider } from "react-native-safe-area-context";

import { SnackbarProvider } from "@/components/ui/snackbar/SnackbarProvider";

import { MoveLinksSheet } from "./MoveLinksSheet";

const mockGet = apiClient.get as jest.Mock;
const mockPatch = apiClient.patch as jest.Mock;

const metrics: Metrics = {
  frame: { x: 0, y: 0, width: 375, height: 812 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const folderListResponse = {
  data: {
    success: true,
    data: {
      systemFolders: {
        all: { linkCount: 3 },
        uncategorized: { linkCount: 1 },
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
        {
          folderId: 7,
          folderName: "개발",
          color: "#61a8ef",
          linkCount: 1,
          lastSavedAt: null,
        },
      ],
    },
  },
};

const renderSheet = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <SafeAreaProvider initialMetrics={metrics}>
        <SnackbarProvider>
          <MoveLinksSheet />
        </SnackbarProvider>
      </SafeAreaProvider>
    </QueryClientProvider>,
  );

describe("MoveLinksSheet", () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockPush.mockClear();
    mockCanGoBack.mockReturnValue(true);
    mockRouteParams.current = { ids: "42" };
    mockGet.mockReset().mockResolvedValue(folderListResponse);
    mockPatch.mockReset().mockResolvedValue({ data: { success: true } });
  });

  test("기본 폴더와 내 폴더를 선택지로 보여준다", async () => {
    await renderSheet();

    expect(await screen.findByText("디자인")).toBeOnTheScreen();
    expect(screen.getByText("미분류")).toBeOnTheScreen();
    expect(screen.getByText("개발")).toBeOnTheScreen();
  });

  test("링크가 이미 있던 폴더를 선택된 상태로 연다", async () => {
    mockRouteParams.current = { ids: "42", folderId: "7" };
    await renderSheet();

    expect(await screen.findByRole("radio", { name: "개발" })).toBeChecked();
  });

  test("폴더를 고르기 전에는 저장할 수 없다", async () => {
    await renderSheet();
    await screen.findByText("디자인");

    expect(
      screen.getByLabelText("저장").props.accessibilityState.disabled,
    ).toBe(true);
  });

  test("폴더를 고르고 저장하면 선택한 링크마다 PATCH 를 보낸다", async () => {
    mockRouteParams.current = { ids: "42,43" };
    await renderSheet();
    await fireEvent.press(await screen.findByRole("radio", { name: "디자인" }));
    await fireEvent.press(screen.getByLabelText("저장"));

    await waitFor(() => expect(mockPatch).toHaveBeenCalledTimes(2));
    expect(mockPatch).toHaveBeenCalledWith("/links/42", { folderId: 3 });
    expect(mockPatch).toHaveBeenCalledWith("/links/43", { folderId: 3 });
  });

  test("미분류로 옮기면 folderId 를 null 로 보낸다", async () => {
    await renderSheet();
    await fireEvent.press(await screen.findByRole("radio", { name: "미분류" }));
    await fireEvent.press(screen.getByLabelText("저장"));

    await waitFor(() =>
      expect(mockPatch).toHaveBeenCalledWith("/links/42", { folderId: null }),
    );
  });

  test("이동에 성공하면 시트를 닫고 스낵바로 알린다", async () => {
    await renderSheet();
    await fireEvent.press(await screen.findByRole("radio", { name: "디자인" }));
    await fireEvent.press(screen.getByLabelText("저장"));

    await waitFor(() => expect(mockBack).toHaveBeenCalled());
    expect(await screen.findByText("디자인에 저장됨")).toBeOnTheScreen();
  });

  test("이동에 실패하면 시트를 닫지 않고 알린다", async () => {
    mockPatch.mockRejectedValue(new Error("network"));
    await renderSheet();
    await fireEvent.press(await screen.findByRole("radio", { name: "디자인" }));
    await fireEvent.press(screen.getByLabelText("저장"));

    expect(
      await screen.findByText("링크를 옮기지 못했어요. 다시 시도해주세요."),
    ).toBeOnTheScreen();
    expect(mockBack).not.toHaveBeenCalled();
  });

  test("취소하면 아무것도 옮기지 않고 시트를 닫는다", async () => {
    await renderSheet();
    await fireEvent.press(screen.getByLabelText("취소"));

    expect(mockPatch).not.toHaveBeenCalled();
    expect(mockBack).toHaveBeenCalled();
  });

  test("새 폴더 만들기를 누르면 폴더 생성 화면으로 이동한다", async () => {
    await renderSheet();
    await fireEvent.press(await screen.findByLabelText("새 폴더 만들기"));

    expect(mockPush).toHaveBeenCalledWith("/create-folder");
  });
});
