let mockIsWeb = false;
jest.mock("@/constants/platform.constants", () => ({
  get isWeb() {
    return mockIsWeb;
  },
  isIOS: false,
  isShareExtension: () => false,
}));

jest.mock("@shared/api", () => {
  const errors = jest.requireActual("@shared/api/errors");
  return { apiClient: { get: jest.fn(), patch: jest.fn() }, ...errors };
});

const mockGetPermission = jest.fn();
const mockRequestPermission = jest.fn();
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
    requestNotificationPermission: () => mockRequestPermission(),
    openNotificationSettings: () => mockOpenSettings(),
  };
});

const mockPush = jest.fn();
let mockScreenFocus: () => void = () => {};
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  useFocusEffect: (effect: () => void) => {
    mockScreenFocus = effect;
    require("react").useEffect(() => effect(), [effect]);
  },
}));

import { apiClient, NetworkError } from "@shared/api";
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
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SnackbarProvider } from "@/components/ui/snackbar/SnackbarProvider";

import { NotificationSection } from "./NotificationSection";

const mockGet = apiClient.get as jest.Mock;
const mockPatch = apiClient.patch as jest.Mock;
const PATH = "/users/me/notification-settings";

const DENIED_NOTICE = "기기 알림이 꺼져 있어 앱 푸시를 받을 수 없어요.";
const APP_CAPTION = "리마인드를 설정한 시간에 알림을 보내드려요.";
const WEB_CAPTION =
  "웹에서는 이메일로 알려드려요. 앱에서는 푸시 알림도 받을 수 있어요.";
const ALL_OFF_CAPTION =
  "알림이 모두 꺼져 있어서 리마인드를 알려드릴 수 없어요.";
const DENIED_ALERT = "기기 알림이 꺼져 있어요";
const SAVE_FAILED = "설정을 바꾸지 못했어요. 잠시 후 다시 시도해 주세요.";
const OFFLINE = "인터넷 연결을 확인해 주세요.";
const PUSH_ENABLED = "앱 푸시 알림을 켰어요";

const settingsResponse = (settings: { email: boolean; push: boolean }) => ({
  data: { success: true, data: settings },
});
const givenSettings = (settings: { email: boolean; push: boolean }) =>
  mockGet.mockResolvedValue(settingsResponse(settings));
const savesAs = (settings: { email: boolean; push: boolean }) =>
  mockPatch.mockResolvedValue(settingsResponse(settings));

const pushSwitch = () => screen.findByRole("switch", { name: "앱 푸시 알림" });
const emailSwitch = () => screen.findByRole("switch", { name: "이메일 알림" });

const renderSection = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 375, height: 812 },
          insets: { top: 0, left: 0, right: 0, bottom: 0 },
        }}
      >
        <SnackbarProvider>
          <NotificationSection />
        </SnackbarProvider>
      </SafeAreaProvider>
    </QueryClientProvider>,
  );
};

// 서스펜스 쿼리는 최소 1초간 신선하다 — OS 설정에 다녀온 시간만큼 흐른 것으로 두고 앱 복귀를 알린다.
const returnToApp = async (elapsed = 2000) => {
  const now = Date.now();
  const dateNow = jest.spyOn(Date, "now").mockReturnValue(now + elapsed);
  await act(async () => {
    focusManager.setFocused(false);
    focusManager.setFocused(true);
  });
  return () => dateNow.mockRestore();
};

// 재조회 결과가 화면에 반영될 때까지 기다린다 — 바뀌는 게 없어야 하는 단언 앞에 쓴다.
const settle = () => act(() => new Promise((r) => setTimeout(r, 50)));

beforeEach(() => {
  mockIsWeb = false;
  mockGetPermission.mockReset().mockResolvedValue("granted");
  mockRequestPermission.mockReset();
  mockOpenSettings.mockReset().mockResolvedValue(undefined);
  mockPush.mockClear();
  mockGet.mockReset();
  givenSettings({ email: true, push: true });
  mockPatch.mockReset();
});

afterEach(() => focusManager.setFocused(undefined));

describe("앱", () => {
  test("앱 푸시·이메일 스위치와 기기 알림 설정 행, 안내 문구를 보여준다", async () => {
    await renderSection();
    expect(screen.getByText("알림")).toBeOnTheScreen();
    expect(await pushSwitch()).toBeChecked();
    expect(await emailSwitch()).toBeChecked();
    expect(screen.getByText("기기 알림 설정")).toBeOnTheScreen();
    expect(screen.getByText(APP_CAPTION)).toBeOnTheScreen();
    expect(
      screen.queryByText("앱 설치하고 푸시 알림 받기"),
    ).not.toBeOnTheScreen();
  });

  test("기기 알림 설정을 누르면 OS 알림 설정을 연다", async () => {
    await renderSection();
    await userEvent.press(screen.getByText("기기 알림 설정"));
    expect(mockOpenSettings).toHaveBeenCalledTimes(1);
  });

  test.each([
    ["granted", true, true, false],
    ["granted", false, false, false],
    ["undetermined", true, false, false],
    ["denied", true, false, true],
    ["denied", false, false, false],
  ])("기기 알림 %s · 계정 푸시 %s 이면 앱 푸시는 %s, 안내는 %s", async (permission, push, isOn, hasNotice) => {
    mockGetPermission.mockResolvedValue(permission);
    givenSettings({ email: true, push: push as boolean });
    await renderSection();
    const toggle = await pushSwitch();
    if (isOn) expect(toggle).toBeChecked();
    else expect(toggle).not.toBeChecked();
    expect(screen.queryByText(DENIED_NOTICE) !== null).toBe(hasNotice);
  });

  test("이메일을 끄면 바로 꺼지고 바꾼 값만 저장한다", async () => {
    let resolve: (value: unknown) => void = () => {};
    mockPatch.mockReturnValue(new Promise((r) => (resolve = r)));
    await renderSection();

    await userEvent.press(await emailSwitch());
    expect(await emailSwitch()).not.toBeChecked();
    expect(mockPatch).toHaveBeenCalledWith(PATH, { email: false });

    await act(async () =>
      resolve(settingsResponse({ email: false, push: true })),
    );
    expect(await emailSwitch()).not.toBeChecked();
  });

  test("저장 중에 다시 누른 것은 무시한다", async () => {
    mockPatch.mockReturnValue(new Promise(() => {}));
    await renderSection();

    await userEvent.press(await emailSwitch());
    await userEvent.press(await emailSwitch());
    await userEvent.press(await pushSwitch());
    expect(mockPatch).toHaveBeenCalledTimes(1);
    expect(await emailSwitch()).not.toBeChecked();
  });

  test.each([
    ["저장에 실패", new Error("500"), SAVE_FAILED],
    ["오프라인", new NetworkError(), OFFLINE],
  ])("%s하면 되돌리고 알린다", async (_case, error, message) => {
    mockPatch.mockRejectedValue(error);
    await renderSection();

    await userEvent.press(await emailSwitch());
    expect(await screen.findByText(message)).toBeOnTheScreen();
    expect(await emailSwitch()).toBeChecked();
  });

  test("앱 푸시를 끄면 확인 없이 계정 푸시를 끈다", async () => {
    savesAs({ email: true, push: false });
    await renderSection();

    await userEvent.press(await pushSwitch());
    expect(mockPatch).toHaveBeenCalledWith(PATH, { push: false });
    expect(await pushSwitch()).not.toBeChecked();
  });

  test("기기 알림이 허용돼 있으면 앱 푸시를 켤 때 바로 저장한다", async () => {
    givenSettings({ email: true, push: false });
    savesAs({ email: true, push: true });
    await renderSection();

    await userEvent.press(await pushSwitch());
    expect(mockPatch).toHaveBeenCalledWith(PATH, { push: true });
    expect(await pushSwitch()).toBeChecked();
    expect(mockRequestPermission).not.toHaveBeenCalled();
  });

  test("아직 묻지 않았으면 권한을 요청하고, 허용하면 켠다", async () => {
    mockGetPermission.mockResolvedValue("undetermined");
    givenSettings({ email: true, push: false });
    savesAs({ email: true, push: true });
    mockRequestPermission.mockImplementation(async () => {
      mockGetPermission.mockResolvedValue("granted");
      return "granted";
    });
    await renderSection();

    await userEvent.press(await pushSwitch());
    expect(mockRequestPermission).toHaveBeenCalledTimes(1);
    expect(mockPatch).toHaveBeenCalledWith(PATH, { push: true });
  });

  test("권한 요청을 거부하면 꺼진 채로 두고 계정 푸시는 바꾸지 않는다", async () => {
    mockGetPermission.mockResolvedValue("undetermined");
    givenSettings({ email: true, push: false });
    mockRequestPermission.mockResolvedValue("denied");
    await renderSection();

    await userEvent.press(await pushSwitch());
    expect(mockRequestPermission).toHaveBeenCalledTimes(1);
    expect(mockPatch).not.toHaveBeenCalled();
    expect(await pushSwitch()).not.toBeChecked();
  });

  test("기기 알림이 거부돼 있으면 켜려 할 때 기기 설정으로 안내하고, 허용하고 돌아오면 켠다", async () => {
    mockGetPermission.mockResolvedValue("denied");
    givenSettings({ email: true, push: false });
    savesAs({ email: true, push: true });
    await renderSection();

    await userEvent.press(await pushSwitch());
    expect(screen.getByText(DENIED_ALERT)).toBeOnTheScreen();
    expect(mockPatch).not.toHaveBeenCalled();
    await userEvent.press(screen.getByRole("button", { name: "설정 열기" }));
    expect(mockOpenSettings).toHaveBeenCalledTimes(1);

    mockGetPermission.mockResolvedValue("granted");
    const restore = await returnToApp();
    await waitFor(() =>
      expect(mockPatch).toHaveBeenCalledWith(PATH, { push: true }),
    );
    expect(await screen.findByText(PUSH_ENABLED)).toBeOnTheScreen();
    expect(await pushSwitch()).toBeChecked();
    restore();
  });

  test("기기 설정에 다녀와도 여전히 거부면 아무것도 바꾸지 않는다", async () => {
    mockGetPermission.mockResolvedValue("denied");
    givenSettings({ email: true, push: false });
    await renderSection();

    await userEvent.press(await pushSwitch());
    await userEvent.press(screen.getByRole("button", { name: "설정 열기" }));
    const restore = await returnToApp();
    await act(async () => {});
    expect(mockPatch).not.toHaveBeenCalled();
    expect(screen.queryByText(PUSH_ENABLED)).not.toBeOnTheScreen();
    restore();

    // 나중에 다른 경로로 허용돼도 뒤늦게 켜지 않는다.
    mockGetPermission.mockResolvedValue("granted");
    const restoreLater = await returnToApp(4000);
    await settle();
    expect(mockPatch).not.toHaveBeenCalled();
    expect(screen.queryByText(PUSH_ENABLED)).not.toBeOnTheScreen();
    restoreLater();
  });

  test("이메일 저장 중에 허용하고 돌아오면, 저장이 끝난 뒤 앱 푸시를 켠다", async () => {
    mockGetPermission.mockResolvedValue("denied");
    givenSettings({ email: true, push: false });
    let resolveEmail: (value: unknown) => void = () => {};
    mockPatch.mockReturnValueOnce(new Promise((r) => (resolveEmail = r)));
    savesAs({ email: false, push: true });
    await renderSection();

    await userEvent.press(await pushSwitch());
    await userEvent.press(screen.getByRole("button", { name: "설정 열기" }));
    await userEvent.press(await emailSwitch());

    mockGetPermission.mockResolvedValue("granted");
    const restore = await returnToApp();
    await settle();
    expect(mockPatch).toHaveBeenCalledTimes(1);

    await act(async () =>
      resolveEmail(settingsResponse({ email: false, push: false })),
    );
    await waitFor(() =>
      expect(mockPatch).toHaveBeenLastCalledWith(PATH, { push: true }),
    );
    expect(await screen.findByText(PUSH_ENABLED)).toBeOnTheScreen();
    restore();
  });

  test("권한 요청이 실패하면 꺼진 채로 두고 알린다", async () => {
    mockGetPermission.mockResolvedValue("undetermined");
    givenSettings({ email: true, push: false });
    mockRequestPermission.mockRejectedValue(new Error("native"));
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    await renderSection();

    await userEvent.press(await pushSwitch());
    expect(await screen.findByText(SAVE_FAILED)).toBeOnTheScreen();
    expect(await pushSwitch()).not.toBeChecked();
    expect(mockPatch).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  test.each([
    ["기기 알림 설정 행", "기기 알림 설정"],
    ["거부 안내", "설정 열기"],
  ])("%s에서 기기 설정을 열지 못해도 예외를 흘리지 않는다", async (_case, label) => {
    mockGetPermission.mockResolvedValue("denied");
    const error = new Error("open");
    mockOpenSettings.mockRejectedValue(error);
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    await renderSection();

    await userEvent.press(await screen.findByText(label));
    await waitFor(() =>
      expect(consoleError).toHaveBeenCalledWith(expect.any(String), error),
    );
    consoleError.mockRestore();
  });

  test("안내의 설정 열기로 허용하고 돌아오면 안내를 숨기고 켰다고 알린다", async () => {
    mockGetPermission.mockResolvedValue("denied");
    await renderSection();
    expect(await screen.findByText(DENIED_NOTICE)).toBeOnTheScreen();
    await userEvent.press(screen.getByRole("button", { name: "설정 열기" }));
    expect(mockOpenSettings).toHaveBeenCalledTimes(1);

    mockGetPermission.mockResolvedValue("granted");
    const restore = await returnToApp();
    await waitFor(() =>
      expect(screen.queryByText(DENIED_NOTICE)).not.toBeOnTheScreen(),
    );
    expect(await screen.findByText(PUSH_ENABLED)).toBeOnTheScreen();
    expect(mockPatch).not.toHaveBeenCalled();
    restore();
  });

  test("앱 푸시와 이메일이 모두 꺼지면 리마인드를 받을 수 없다고 알린다", async () => {
    mockGetPermission.mockResolvedValue("denied");
    givenSettings({ email: false, push: true });
    await renderSection();
    expect(await screen.findByText(ALL_OFF_CAPTION)).toBeOnTheScreen();
    expect(screen.queryByText(APP_CAPTION)).not.toBeOnTheScreen();
  });

  test("화면에 다시 들어오면 설정값을 다시 읽는다", async () => {
    await renderSection();
    await pushSwitch();
    givenSettings({ email: false, push: true });
    await act(async () => mockScreenFocus());
    await waitFor(async () => expect(await emailSwitch()).not.toBeChecked());
  });

  test("설정을 불러오지 못해도 기기 알림 설정은 쓸 수 있고, 다시 들어오면 다시 읽는다", async () => {
    mockGet.mockRejectedValue(new Error("500"));
    await renderSection();
    expect(await screen.findAllByText("-")).toHaveLength(2);
    await userEvent.press(screen.getByText("기기 알림 설정"));
    expect(mockOpenSettings).toHaveBeenCalledTimes(1);

    givenSettings({ email: true, push: true });
    await act(async () => mockScreenFocus());
    expect(await pushSwitch()).toBeChecked();
  });
});

describe("웹", () => {
  beforeEach(() => {
    mockIsWeb = true;
  });

  test("이메일 스위치와 앱 설치 안내 행, 웹 안내 문구를 보여준다", async () => {
    await renderSection();
    expect(await emailSwitch()).toBeChecked();
    expect(screen.getByText("앱 설치하고 푸시 알림 받기")).toBeOnTheScreen();
    expect(screen.getByText(WEB_CAPTION)).toBeOnTheScreen();
    expect(screen.queryByText("기기 알림 설정")).not.toBeOnTheScreen();
    expect(
      screen.queryByRole("switch", { name: "앱 푸시 알림" }),
    ).not.toBeOnTheScreen();
    expect(mockGetPermission).not.toHaveBeenCalled();
  });

  test("이메일이 꺼져 있으면 리마인드를 받을 수 없다고 알린다", async () => {
    givenSettings({ email: false, push: true });
    await renderSection();
    expect(await screen.findByText(ALL_OFF_CAPTION)).toBeOnTheScreen();
    expect(screen.queryByText(WEB_CAPTION)).not.toBeOnTheScreen();
  });

  test("앱 설치 안내 행을 누르면 앱 설치 시트를 연다", async () => {
    await renderSection();
    await userEvent.press(screen.getByText("앱 설치하고 푸시 알림 받기"));
    expect(mockPush).toHaveBeenCalledWith("/app-install");
  });
});
