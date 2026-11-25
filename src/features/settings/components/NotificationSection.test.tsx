let mockIsWeb = false;
jest.mock("@/constants/platform.constants", () => ({
  get isWeb() {
    return mockIsWeb;
  },
}));

const mockGetPermission = jest.fn();
const mockOpenSettings = jest.fn();
jest.mock("@/lib/notifications", () => {
  const { queryOptions } = require("@tanstack/react-query");
  return {
    notificationQueries: {
      permission: () =>
        queryOptions({
          queryKey: ["notification", "permission"],
          queryFn: () => mockGetPermission(),
        }),
    },
    openNotificationSettings: () => mockOpenSettings(),
  };
});

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

import {
  focusManager,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import {
  act,
  render,
  screen,
  userEvent,
  waitFor,
} from "@testing-library/react-native";

import { NotificationSection } from "./NotificationSection";

const DENIED_MESSAGE = "기기 알림이 꺼져 있어 앱 푸시를 받을 수 없어요.";

const renderSection = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <NotificationSection />
    </QueryClientProvider>,
  );
};

beforeEach(() => {
  mockIsWeb = false;
  mockGetPermission.mockReset();
  mockGetPermission.mockResolvedValue("granted");
  mockOpenSettings.mockClear();
  mockPush.mockClear();
});

describe("앱", () => {
  test("알림 섹션에 기기 알림 설정 행과 안내 문구를 보여준다", async () => {
    await renderSection();
    expect(screen.getByText("알림")).toBeOnTheScreen();
    expect(screen.getByText("기기 알림 설정")).toBeOnTheScreen();
    expect(
      screen.getByText("리마인드를 설정한 시간에 알림을 보내드려요."),
    ).toBeOnTheScreen();
    expect(
      screen.queryByText("앱 설치하고 푸시 알림 받기"),
    ).not.toBeOnTheScreen();
  });

  test("기기 알림 설정을 누르면 OS 알림 설정을 연다", async () => {
    await renderSection();
    await userEvent.press(screen.getByText("기기 알림 설정"));
    expect(mockOpenSettings).toHaveBeenCalledTimes(1);
  });

  test("기기 알림이 거부돼 있으면 안내를 보여주고, 설정 열기로 OS 알림 설정을 연다", async () => {
    mockGetPermission.mockResolvedValue("denied");
    await renderSection();
    expect(await screen.findByText(DENIED_MESSAGE)).toBeOnTheScreen();
    await userEvent.press(screen.getByRole("button", { name: "설정 열기" }));
    expect(mockOpenSettings).toHaveBeenCalledTimes(1);
  });

  test.each([
    "granted",
    "undetermined",
  ])("기기 알림이 %s 이면 안내를 보여주지 않는다", async (permission) => {
    mockGetPermission.mockResolvedValue(permission);
    await renderSection();
    await act(async () => {});
    expect(mockGetPermission).toHaveBeenCalled();
    expect(screen.queryByText(DENIED_MESSAGE)).not.toBeOnTheScreen();
  });

  test("앱으로 돌아오면 권한을 다시 읽어, 허용됐으면 안내를 숨긴다", async () => {
    mockGetPermission.mockResolvedValue("denied");
    await renderSection();
    await screen.findByText(DENIED_MESSAGE);

    mockGetPermission.mockResolvedValue("granted");
    // 서스펜스 쿼리는 최소 1초간 신선하다 — OS 설정에 다녀온 시간만큼 흐른 것으로 둔다.
    const now = Date.now();
    const dateNow = jest.spyOn(Date, "now").mockReturnValue(now + 2000);
    await act(async () => {
      focusManager.setFocused(false);
      focusManager.setFocused(true);
    });

    await waitFor(() =>
      expect(screen.queryByText(DENIED_MESSAGE)).not.toBeOnTheScreen(),
    );
    focusManager.setFocused(undefined);
    dateNow.mockRestore();
  });
});

describe("웹", () => {
  beforeEach(() => {
    mockIsWeb = true;
  });

  test("기기 알림 대신 앱 설치 안내 행과 웹 안내 문구를 보여준다", async () => {
    await renderSection();
    expect(screen.getByText("앱 설치하고 푸시 알림 받기")).toBeOnTheScreen();
    expect(
      screen.getByText(
        "웹에서는 이메일로 알려드려요. 앱에서는 푸시 알림도 받을 수 있어요.",
      ),
    ).toBeOnTheScreen();
    expect(screen.queryByText("기기 알림 설정")).not.toBeOnTheScreen();
    expect(mockGetPermission).not.toHaveBeenCalled();
  });

  test("앱 설치 안내 행을 누르면 앱 설치 시트를 연다", async () => {
    await renderSection();
    await userEvent.press(screen.getByText("앱 설치하고 푸시 알림 받기"));
    expect(mockPush).toHaveBeenCalledWith("/app-install");
  });
});
