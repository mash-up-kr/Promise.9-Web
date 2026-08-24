// client.ts 는 import 시 EXPO_PUBLIC_API_BASE_URL 를 요구하므로 apiClient 만 mock 하고
// 에러 유틸(ApiError·isApiError)은 실제 구현을 쓴다.
jest.mock("@shared/api", () => {
  const errors = jest.requireActual("@shared/api/errors");
  return {
    apiClient: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
    ...errors,
  };
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

import { FOLDER_ERROR_CODE } from "@/entities/folder/folder.errors";

const mockBack = jest.fn();
const mockParams = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack }),
  useLocalSearchParams: () => mockParams(),
}));

import { type FolderFormMode, FolderFormSheet } from "./FolderFormSheet";

const mockPost = apiClient.post as jest.Mock;
const mockPatch = apiClient.patch as jest.Mock;

const metrics: Metrics = {
  frame: { x: 0, y: 0, width: 375, height: 812 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const renderSheet = (mode: FolderFormMode) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider initialMetrics={metrics}>
        <SnackbarProvider>
          <FolderFormSheet mode={mode} />
        </SnackbarProvider>
      </SafeAreaProvider>
    </QueryClientProvider>,
  );
};

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

beforeEach(() => {
  mockBack.mockClear();
  mockParams.mockReturnValue({});
  mockPost.mockReset();
  mockPatch.mockReset();
});

describe('FolderFormSheet mode="create"', () => {
  beforeEach(() => {
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

  test("헤더 타이틀을 렌더한다", async () => {
    await renderSheet("create");
    expect(screen.getByText("새 폴더 만들기")).toBeOnTheScreen();
  });

  test("이름이 비어 있으면 저장 버튼이 비활성이다", async () => {
    await renderSheet("create");
    expect(
      screen.getByLabelText("저장").props.accessibilityState.disabled,
    ).toBe(true);
  });

  test("저장하면 이름·색상 hex 로 폴더를 생성하고 시트를 닫는다", async () => {
    await renderSheet("create");
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

  test("이름이 중복되면(errorCode 920002) 다이얼로그로 안내하고 시트를 닫지 않는다", async () => {
    mockPost.mockRejectedValue(conflictError(FOLDER_ERROR_CODE.DUPLICATE_NAME));
    await renderSheet("create");
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
    await renderSheet("create");
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
    await renderSheet("create");
    await typeName("디자인");
    await fireEvent.press(screen.getByLabelText("저장"));

    expect(
      await screen.findByText("폴더를 만들지 못했어요. 다시 시도해주세요."),
    ).toBeOnTheScreen();
    expect(mockBack).not.toHaveBeenCalled();
  });

  test("취소하면 시트를 닫는다", async () => {
    await renderSheet("create");
    await fireEvent.press(screen.getByText("취소"));
    expect(mockBack).toHaveBeenCalled();
  });
});

describe('FolderFormSheet mode="edit"', () => {
  beforeEach(() => {
    mockParams.mockReturnValue({ id: "3", name: "디자인", color: "purple" });
    mockPatch.mockResolvedValue({ data: { success: true, data: null } });
  });

  test("편집 시트 타이틀과 기존 폴더 이름을 채워 보여준다", async () => {
    await renderSheet("edit");

    expect(screen.getByText("폴더 편집")).toBeOnTheScreen();
    expect(
      screen.getByPlaceholderText("폴더 이름을 입력하세요.").props.value,
    ).toBe("디자인");
  });

  test("기존 색상이 선택된 상태로 시작한다", async () => {
    await renderSheet("edit");

    expect(
      screen.getByTestId("folder-color-purple").props.accessibilityState
        .selected,
    ).toBe(true);
  });

  test("이름만 고치면 folderId 로 이름만 보내고 시트를 닫는다", async () => {
    await renderSheet("edit");
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
    await renderSheet("edit");
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
    await renderSheet("edit");
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
      conflictError(FOLDER_ERROR_CODE.DUPLICATE_NAME),
    );
    await renderSheet("edit");
    await fireEvent.press(screen.getByLabelText("저장"));

    expect(
      await screen.findByText("같은 이름의 폴더가 있어요"),
    ).toBeOnTheScreen();
    expect(screen.getByText("다른 이름을 입력해 주세요")).toBeOnTheScreen();
    expect(mockBack).not.toHaveBeenCalled();
  });

  test("중복 이름이 아닌 409 는 일반 실패로 안내한다", async () => {
    mockPatch.mockRejectedValue(conflictError(910002));
    await renderSheet("edit");
    await fireEvent.press(screen.getByLabelText("저장"));

    expect(
      await screen.findByText("폴더를 수정하지 못했어요. 다시 시도해주세요."),
    ).toBeOnTheScreen();
    expect(mockBack).not.toHaveBeenCalled();
  });

  // 서버 팔레트 밖의 색(기본색 등)으로 들어와도 폼이 검증에 걸려 저장이 막히면 안 된다.
  test("팔레트에 없는 색으로 들어오면 선택 가능한 색으로 폴백한다", async () => {
    mockParams.mockReturnValue({ id: "3", name: "기타", color: "gray" });
    await renderSheet("edit");

    expect(
      screen.getByLabelText("저장").props.accessibilityState.disabled,
    ).toBe(false);
  });

  test("취소하면 시트를 닫는다", async () => {
    await renderSheet("edit");
    await fireEvent.press(screen.getByText("취소"));

    expect(mockBack).toHaveBeenCalled();
  });
});
