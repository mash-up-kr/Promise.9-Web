// client.ts 는 import 시 EXPO_PUBLIC_API_BASE_URL 를 요구하므로 apiClient 만 mock 하고
// 에러 유틸(ApiError·isApiError)은 실제 구현을 쓴다.
jest.mock("@shared/api", () => {
  const errors = jest.requireActual("@shared/api/errors");
  return { apiClient: { get: jest.fn(), post: jest.fn() }, ...errors };
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

import { FOLDER_ERROR_CODE } from "./folder.errors";

const mockBack = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ back: mockBack }) }));

import { CreateFolderSheet } from "./CreateFolderSheet";

const mockPost = apiClient.post as jest.Mock;

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
          <CreateFolderSheet />
        </SnackbarProvider>
      </SafeAreaProvider>
    </QueryClientProvider>,
  );
};

const typeName = async (name: string) => {
  await fireEvent.changeText(
    screen.getByPlaceholderText("폴더 이름을 입력하세요."),
    name,
  );
  await waitFor(() =>
    expect(
      screen.getByLabelText("저장").props.accessibilityState.disabled,
    ).toBe(false),
  );
};

describe("CreateFolderSheet", () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockPost.mockReset();
    mockPost.mockResolvedValue({
      data: {
        success: true,
        data: {
          folderId: 1,
          folderName: "디자인",
          color: "#61a8ef",
          createdAt: "2026-07-26T00:00:00.000Z",
        },
      },
    });
  });

  test("헤더 타이틀을 렌더한다", async () => {
    await renderSheet();
    expect(screen.getByText("새 폴더 만들기")).toBeOnTheScreen();
  });

  test("이름이 비어 있으면 저장 버튼이 비활성이다", async () => {
    await renderSheet();
    expect(
      screen.getByLabelText("저장").props.accessibilityState.disabled,
    ).toBe(true);
  });

  test("저장하면 이름·색상 hex 로 폴더를 생성하고 시트를 닫는다", async () => {
    await renderSheet();
    await typeName("디자인");
    await fireEvent.press(screen.getByLabelText("저장"));

    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith("/folders", {
        folderName: "디자인",
        color: "#61a8ef",
      }),
    );
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
  });

  const conflictError = (errorCode: number) =>
    new ApiError({
      status: 409,
      data: {
        success: false,
        error: {
          code: 409,
          errorCode,
          message: "이미 존재하는 폴더 이름입니다.",
          timestamp: "2026-07-26T00:00:00.000Z",
        },
      },
    } as unknown as AxiosResponse);

  test("이름이 중복되면(errorCode 920002) 다이얼로그로 안내하고 시트를 닫지 않는다", async () => {
    mockPost.mockRejectedValue(conflictError(FOLDER_ERROR_CODE.DUPLICATE_NAME));
    await renderSheet();
    await typeName("디자인");
    await fireEvent.press(screen.getByLabelText("저장"));

    expect(
      await screen.findByText("같은 이름의 폴더가 있어요"),
    ).toBeOnTheScreen();
    expect(screen.getByText("다른 이름을 입력해 주세요")).toBeOnTheScreen();
    expect(mockBack).not.toHaveBeenCalled();
  });

  // 확인을 누르면 이름만 고쳐 다시 저장할 수 있어야 한다 — 입력값을 잃으면 안 된다.
  test("중복 안내에서 확인을 누르면 다이얼로그만 닫고 입력값은 남는다", async () => {
    mockPost.mockRejectedValue(conflictError(FOLDER_ERROR_CODE.DUPLICATE_NAME));
    await renderSheet();
    await typeName("디자인");
    await fireEvent.press(screen.getByLabelText("저장"));
    await fireEvent.press(await screen.findByText("확인"));

    expect(screen.queryByText("같은 이름의 폴더가 있어요")).toBeNull();
    expect(
      screen.getByPlaceholderText("폴더 이름을 입력하세요.").props.value,
    ).toBe("디자인");
    expect(mockBack).not.toHaveBeenCalled();
  });

  // 409 는 "중복 생성 또는 리소스 상태 충돌" 이라 상태 코드만으로는 중복 이름을 단정할 수 없다.
  test("중복 이름이 아닌 409 는 일반 실패로 안내한다", async () => {
    mockPost.mockRejectedValue(conflictError(910002));
    await renderSheet();
    await typeName("디자인");
    await fireEvent.press(screen.getByLabelText("저장"));

    expect(
      await screen.findByText("폴더를 만들지 못했어요. 다시 시도해주세요."),
    ).toBeOnTheScreen();
    expect(mockBack).not.toHaveBeenCalled();
  });

  test("취소하면 시트를 닫는다", async () => {
    await renderSheet();
    await fireEvent.press(screen.getByText("취소"));
    expect(mockBack).toHaveBeenCalled();
  });
});
