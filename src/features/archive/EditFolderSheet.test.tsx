// client.ts 는 import 시 EXPO_PUBLIC_API_BASE_URL 를 요구하므로 apiClient 만 mock 하고
// 에러 유틸(ApiError·isApiError)은 실제 구현을 쓴다.
jest.mock("@shared/api", () => {
  const errors = jest.requireActual("@shared/api/errors");
  return { apiClient: { patch: jest.fn() }, ...errors };
});

import { ApiError, apiClient } from "@shared/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import type { AxiosResponse } from "axios";
import { type Metrics, SafeAreaProvider } from "react-native-safe-area-context";

import { SnackbarProvider } from "@/components/ui/snackbar/SnackbarProvider";

import { FOLDER_ERROR_CODE } from "./archive.constants";

const mockBack = jest.fn();
const mockParams = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack }),
  useLocalSearchParams: () => mockParams(),
}));

import { EditFolderSheet } from "./EditFolderSheet";

const mockPatch = apiClient.patch as jest.Mock;

const metrics: Metrics = {
  frame: { x: 0, y: 0, width: 375, height: 812 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const renderSheet = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider initialMetrics={metrics}>
        <SnackbarProvider>
          <EditFolderSheet />
        </SnackbarProvider>
      </SafeAreaProvider>
    </QueryClientProvider>,
  );
};

describe("EditFolderSheet", () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockParams.mockReturnValue({ id: "3", name: "디자인", color: "purple" });
    mockPatch.mockReset();
    mockPatch.mockResolvedValue({ data: { success: true, data: null } });
  });

  test("편집 시트 타이틀과 기존 폴더 이름을 채워 보여준다", async () => {
    await renderSheet();

    expect(screen.getByText("폴더 편집")).toBeOnTheScreen();
    expect(
      screen.getByPlaceholderText("폴더 이름을 입력하세요.").props.value,
    ).toBe("디자인");
  });

  test("기존 색상이 선택된 상태로 시작한다", async () => {
    await renderSheet();

    expect(
      screen.getByTestId("folder-color-purple").props.accessibilityState
        .selected,
    ).toBe(true);
  });

  test("이름만 고치면 folderId 로 이름만 보내고 시트를 닫는다", async () => {
    await renderSheet();
    await fireEvent.changeText(
      screen.getByPlaceholderText("폴더 이름을 입력하세요."),
      "디자인 자료",
    );
    await fireEvent.press(screen.getByLabelText("저장"));

    await waitFor(() =>
      expect(mockPatch).toHaveBeenCalledWith("/folders/3", {
        folderName: "디자인 자료",
      }),
    );
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
  });

  test("색상을 바꾸면 색상 hex 도 함께 보낸다", async () => {
    await renderSheet();
    await fireEvent.press(screen.getByTestId("folder-color-red"));
    await fireEvent.press(screen.getByLabelText("저장"));

    await waitFor(() =>
      expect(mockPatch).toHaveBeenCalledWith("/folders/3", {
        folderName: "디자인",
        color: "#e34647",
      }),
    );
  });

  // 팔레트 밖 색은 폼에 폴백 색으로 잡히므로, 그대로 보내면 이름만 고쳐도 색이 덮인다.
  test("팔레트에 없는 색으로 들어와 이름만 고치면 색상을 보내지 않는다", async () => {
    mockParams.mockReturnValue({ id: "3", name: "기타", color: "gray" });
    await renderSheet();
    await fireEvent.changeText(
      screen.getByPlaceholderText("폴더 이름을 입력하세요."),
      "기타 자료",
    );
    await fireEvent.press(screen.getByLabelText("저장"));

    await waitFor(() =>
      expect(mockPatch).toHaveBeenCalledWith("/folders/3", {
        folderName: "기타 자료",
      }),
    );
  });

  test("이름이 중복되면 다이얼로그로 안내하고 시트를 닫지 않는다", async () => {
    mockPatch.mockRejectedValue(
      new ApiError({
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
      } as unknown as AxiosResponse),
    );
    await renderSheet();
    await fireEvent.press(screen.getByLabelText("저장"));

    expect(
      await screen.findByText("같은 이름의 폴더가 있어요"),
    ).toBeOnTheScreen();
    expect(screen.getByText("다른 이름을 입력해 주세요")).toBeOnTheScreen();
    expect(mockBack).not.toHaveBeenCalled();
  });

  // 서버 팔레트 밖의 색(기본색 등)으로 들어와도 폼이 검증에 걸려 저장이 막히면 안 된다.
  test("팔레트에 없는 색으로 들어오면 선택 가능한 색으로 폴백한다", async () => {
    mockParams.mockReturnValue({ id: "3", name: "기타", color: "gray" });
    await renderSheet();

    expect(
      screen.getByLabelText("저장").props.accessibilityState.disabled,
    ).toBe(false);
  });

  test("취소하면 시트를 닫는다", async () => {
    await renderSheet();
    await fireEvent.press(screen.getByText("취소"));

    expect(mockBack).toHaveBeenCalled();
  });
});
