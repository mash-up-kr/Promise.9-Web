// client.ts 는 import 시 EXPO_PUBLIC_API_BASE_URL 를 요구하므로 @shared/api 를 mock 한다.
jest.mock("@shared/api", () => {
  const errors = jest.requireActual("@shared/api/errors");
  return {
    apiClient: {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    },
    ...errors,
  };
});

import { apiClient } from "@shared/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { SnackbarProvider } from "@/components/ui/snackbar/SnackbarProvider";

import { ArchiveScreen } from "./ArchiveScreen";
import { SYSTEM_FOLDERS } from "./archive.constants";

const mockGet = apiClient.get as jest.Mock;
const mockPut = apiClient.put as jest.Mock;
const mockDelete = apiClient.delete as jest.Mock;
const mockPush = jest.fn();
const mockNavigate = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, navigate: mockNavigate }),
}));

const folderResponse = {
  data: {
    success: true,
    data: {
      systemFolders: {
        all: { linkCount: 370 },
        uncategorized: { linkCount: 12 },
        favorite: { linkCount: 0 },
        recentlyDeleted: { linkCount: 3 },
      },
      folders: [
        {
          folderId: 1,
          folderName: "디자인",
          color: "#61a8ef",
          linkCount: 5,
          lastSavedAt: null,
        },
      ],
    },
  },
};

const renderScreen = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 375, height: 812 },
          insets: { top: 47, left: 0, right: 0, bottom: 34 },
        }}
      >
        <SnackbarProvider>
          <ArchiveScreen />
        </SnackbarProvider>
      </SafeAreaProvider>
    </QueryClientProvider>,
  );
};

describe("ArchiveScreen", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockNavigate.mockClear();
    mockGet.mockReset();
    mockGet.mockResolvedValue(folderResponse);
    mockPut.mockReset();
    mockPut.mockResolvedValue({ data: { success: true, data: null } });
    mockDelete.mockReset();
    mockDelete.mockResolvedValue({ data: { success: true, data: null } });
  });

  test("기본 폴더/내 폴더 섹션 타이틀을 렌더한다", async () => {
    await renderScreen();
    expect(await screen.findByText("기본 폴더")).toBeOnTheScreen();
    expect(screen.getByText("내 폴더")).toBeOnTheScreen();
  });

  test("서버 응답의 기본 폴더와 사용자 폴더 항목을 렌더한다", async () => {
    await renderScreen();
    // 기본 폴더는 응답 전에도 보이므로, 응답 도착 기준은 사용자 폴더로 잡는다.
    expect(await screen.findByText("디자인")).toBeOnTheScreen();
    expect(screen.getByText("전체")).toBeOnTheScreen();
    expect(screen.getByText("즐겨찾기")).toBeOnTheScreen();
    expect(screen.getByText("최근 삭제된 링크")).toBeOnTheScreen();
  });

  test("폴더를 누르면 해당 폴더 상세로 이동한다", async () => {
    await renderScreen();
    fireEvent.press(await screen.findByLabelText("전체"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/archive/[id]",
      params: { id: "all", name: "전체" },
    });
  });

  test("사용자 폴더를 누르면 folderId 로 상세로 이동한다", async () => {
    await renderScreen();
    fireEvent.press(await screen.findByLabelText("디자인"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/archive/[id]",
      params: { id: "1", name: "디자인" },
    });
  });

  test("더보기 → 폴더 정렬 편집 시 편집 모드로 전환한다", async () => {
    await renderScreen();
    await screen.findByText("디자인");
    await fireEvent.press(screen.getByLabelText("더보기"));
    await fireEvent.press(screen.getByText("폴더 정렬 편집"));
    expect(screen.getByLabelText("디자인 순서 변경")).toBeOnTheScreen();
    // 완료는 텍스트가 아니라 헤더 우측 check 아이콘 버튼이다.
    expect(screen.getByLabelText("완료")).toBeOnTheScreen();
    expect(screen.queryByText("완료")).toBeNull();
    expect(screen.queryByLabelText("검색")).toBeNull();
    expect(screen.queryByLabelText("더보기")).toBeNull();
  });

  test("편집 모드에서 완료를 누르면 일반 모드로 돌아온다", async () => {
    await renderScreen();
    await screen.findByText("디자인");
    await fireEvent.press(screen.getByLabelText("더보기"));
    await fireEvent.press(screen.getByText("폴더 정렬 편집"));
    await fireEvent.press(screen.getByLabelText("완료"));

    // 일반 모드 복귀: 더보기 버튼이 다시 보이고 핸들은 사라진다.
    expect(screen.getByLabelText("더보기")).toBeOnTheScreen();
    expect(screen.queryByLabelText("디자인 순서 변경")).toBeNull();
  });

  // 순서를 바꾸지 않았는데 저장을 보내면 서버에 의미 없는 쓰기가 생긴다.
  test("순서를 바꾸지 않고 완료하면 저장 요청을 보내지 않는다", async () => {
    await renderScreen();
    await screen.findByText("디자인");
    await fireEvent.press(screen.getByLabelText("더보기"));
    await fireEvent.press(screen.getByText("폴더 정렬 편집"));
    await fireEvent.press(screen.getByLabelText("완료"));

    expect(mockPut).not.toHaveBeenCalled();
  });

  describe("폴더 컨텍스트 메뉴", () => {
    const openMenu = async () => {
      await renderScreen();
      await fireEvent(await screen.findByLabelText("디자인"), "longPress");
    };

    // 메뉴에서 고른 동작은 팝오버 Modal 이 사라진 뒤에 실행된다(iOS Modal 중첩 회피).
    // RNTL 은 네이티브 dismiss 를 흉내내지 않고 닫힌 Modal 은 트리에서 사라지므로,
    // 누르기 전에 onDismiss 를 붙잡아 두었다가 직접 호출한다.
    const selectMenuItem = async (label: string) => {
      const dismiss: () => void =
        screen.getByTestId("popover-overlay").props.onDismiss;
      await fireEvent.press(screen.getByText(label));
      await act(async () => dismiss());
    };

    test("내 폴더를 길게 누르면 편집·삭제 메뉴를 보여준다", async () => {
      await openMenu();
      expect(screen.getByText("폴더 편집")).toBeOnTheScreen();
      expect(screen.getByText("삭제")).toBeOnTheScreen();
    });

    test("폴더 편집을 누르면 편집 시트로 이동한다", async () => {
      await openMenu();
      await selectMenuItem("폴더 편집");

      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/edit-folder",
        params: { id: "1", name: "디자인", color: "blue" },
      });
    });

    test("삭제를 누르면 확인 다이얼로그를 먼저 보여준다", async () => {
      await openMenu();
      await selectMenuItem("삭제");

      expect(screen.getByText("폴더를 삭제하시겠어요?")).toBeOnTheScreen();
      expect(
        screen.getByText("저장된 링크는 미분류 폴더로 이동돼요"),
      ).toBeOnTheScreen();
      // 확인 전에는 삭제 요청을 보내지 않는다.
      expect(mockDelete).not.toHaveBeenCalled();
    });

    test("다이얼로그에서 폴더 삭제를 확인하면 삭제 요청을 보낸다", async () => {
      await openMenu();
      await selectMenuItem("삭제");
      await fireEvent.press(screen.getByText("폴더 삭제"));

      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalledWith("/folders/1");
      });
    });

    test("다이얼로그에서 취소하면 삭제하지 않는다", async () => {
      await openMenu();
      await selectMenuItem("삭제");
      await fireEvent.press(screen.getByText("취소"));

      expect(mockDelete).not.toHaveBeenCalled();
    });
  });

  describe("로딩 중", () => {
    // 응답을 보류시켜 pending 상태를 관찰한다. 반환된 resolve 로 정리한다.
    const renderPending = async () => {
      let resolveGet: (value: unknown) => void = () => {};
      mockGet.mockReturnValue(
        new Promise((resolve) => {
          resolveGet = resolve;
        }),
      );
      await renderScreen();
      return () => resolveGet(folderResponse);
    };

    // 기본 폴더는 이름·순서가 고정이라 서버 응답을 기다릴 이유가 없다.
    test("기본 폴더 목록을 바로 보여준다", async () => {
      const settle = await renderPending();
      expect(screen.getByText("전체")).toBeOnTheScreen();
      expect(screen.getByText("미분류")).toBeOnTheScreen();
      expect(screen.getByText("즐겨찾기")).toBeOnTheScreen();
      expect(screen.getByText("최근 삭제된 링크")).toBeOnTheScreen();
      settle();
      await screen.findByText("디자인");
    });

    test("기본 폴더의 링크 개수는 스켈레톤으로 보여준다", async () => {
      const settle = await renderPending();
      expect(screen.getAllByTestId("folder-count-skeleton")).toHaveLength(
        SYSTEM_FOLDERS.length,
      );
      settle();
      await screen.findByText("디자인");
    });

    test("내 폴더 목록은 스켈레톤으로 보여준다", async () => {
      const settle = await renderPending();
      expect(screen.getByTestId("folder-list-skeleton")).toBeOnTheScreen();
      settle();
      await screen.findByText("디자인");
    });

    test("응답이 오면 스켈레톤 대신 실제 개수를 보여준다", async () => {
      await renderScreen();
      expect(await screen.findByText("370")).toBeOnTheScreen();
      expect(screen.queryByTestId("folder-count-skeleton")).toBeNull();
      expect(screen.queryByTestId("folder-list-skeleton")).toBeNull();
    });
  });

  test("조회 실패 시 에러 메시지와 다시 시도를 보여준다", async () => {
    mockGet.mockRejectedValue(new Error("network"));
    await renderScreen();
    expect(
      await screen.findByText("폴더를 불러오지 못했어요."),
    ).toBeOnTheScreen();
    expect(screen.getByText("다시 시도")).toBeOnTheScreen();
    // 실패는 화면 전체를 대체한다 — 기본 폴더도 남기지 않는다.
    expect(screen.queryByText("전체")).toBeNull();
  });

  test("다시 시도를 누르면 재조회해 폴더 목록을 보여준다", async () => {
    mockGet
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(folderResponse);
    await renderScreen();
    await fireEvent.press(await screen.findByText("다시 시도"));

    expect(await screen.findByText("디자인")).toBeOnTheScreen();
    expect(screen.getByText("전체")).toBeOnTheScreen();
  });
});
