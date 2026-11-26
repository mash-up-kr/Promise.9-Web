const mockPlatform = { isAndroid: false };

import { renderHook } from "@testing-library/react-native";
import { PermissionStatus } from "expo";
import { startActivityAsync } from "expo-intent-launcher";
import {
  AndroidImportance,
  clearLastNotificationResponse,
  getNotificationChannelAsync,
  getPermissionsAsync,
  IosAuthorizationStatus,
  type NotificationChannel,
  type NotificationPermissionsStatus,
  type NotificationResponse,
  requestPermissionsAsync,
  setNotificationChannelAsync,
  setNotificationHandler,
  useLastNotificationResponse,
} from "expo-notifications";
import { router } from "expo-router";
import { Linking } from "react-native";
import { linkDetailHref } from "@/constants/routes.constants";
import { queryClient } from "@/lib/queryClient";

import {
  getDeviceNotificationPermission,
  getReminderLinkHref,
  notificationQueries,
  openNotificationSettings,
  requestNotificationPermission,
  requestNotificationPermissionOnce,
  setupNotifications,
  toDeviceNotificationPermission,
  useNotificationResponseNavigation,
} from "./notifications";

jest.mock("@/constants/platform.constants", () => ({
  get isAndroid() {
    return mockPlatform.isAndroid;
  },
}));
jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { android: { package: "com.mashup.promise9" } } },
}));
jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));
jest.mock("expo-intent-launcher", () => ({
  ActivityAction: {
    APP_NOTIFICATION_SETTINGS: "android.settings.APP_NOTIFICATION_SETTINGS",
  },
  startActivityAsync: jest.fn(),
}));

function permissions(
  overrides: Partial<NotificationPermissionsStatus>,
): NotificationPermissionsStatus {
  return {
    status: PermissionStatus.DENIED,
    granted: false,
    canAskAgain: true,
    expires: "never",
    ...overrides,
  } as NotificationPermissionsStatus;
}

const GRANTED = permissions({
  status: PermissionStatus.GRANTED,
  granted: true,
});
const DENIED = permissions({ status: PermissionStatus.DENIED });
const UNDETERMINED = permissions({ status: PermissionStatus.UNDETERMINED });

function channel(importance: AndroidImportance) {
  return { id: "reminder", importance } as NotificationChannel;
}

function response(data: unknown, identifier = "n1") {
  return {
    actionIdentifier: "expo.modules.notifications.actions.DEFAULT",
    notification: { request: { identifier, content: { data } } },
  } as NotificationResponse;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockPlatform.isAndroid = false;
  queryClient.clear();
});

describe("toDeviceNotificationPermission", () => {
  test("허용·거부·미요청을 그대로 옮긴다", () => {
    expect(toDeviceNotificationPermission(GRANTED, null)).toBe("granted");
    expect(toDeviceNotificationPermission(DENIED, null)).toBe("denied");
    expect(toDeviceNotificationPermission(UNDETERMINED, null)).toBe(
      "undetermined",
    );
  });

  // iOS 는 provisional 을 루트 status 'undetermined' 로 내려준다 — ios.status 로 판단해야 한다.
  test("iOS 임시 권한(provisional)은 허용으로 본다", () => {
    const provisional = permissions({
      status: PermissionStatus.UNDETERMINED,
      ios: { status: IosAuthorizationStatus.PROVISIONAL },
    } as Partial<NotificationPermissionsStatus>);

    expect(toDeviceNotificationPermission(provisional, null)).toBe("granted");
  });

  test("앱 알림은 허용인데 리마인드 채널만 꺼져 있으면 거부로 본다", () => {
    expect(
      toDeviceNotificationPermission(GRANTED, channel(AndroidImportance.NONE)),
    ).toBe("denied");
    expect(
      toDeviceNotificationPermission(GRANTED, channel(AndroidImportance.HIGH)),
    ).toBe("granted");
  });
});

describe("getReminderLinkHref", () => {
  test("리마인드 알림의 linkId 로 링크 상세 경로를 만든다", () => {
    expect(getReminderLinkHref({ type: "LINK_REMINDER", linkId: 123 })).toEqual(
      linkDetailHref("123"),
    );
    expect(
      getReminderLinkHref({ type: "LINK_REMINDER", linkId: "123" }),
    ).toEqual(linkDetailHref("123"));
  });

  test.each([
    undefined,
    null,
    {},
    { type: "LINK_REMINDER" },
    { type: "OTHER", linkId: 123 },
    { type: "LINK_REMINDER", linkId: 0 },
    { type: "LINK_REMINDER", linkId: -1 },
    { type: "LINK_REMINDER", linkId: 1.5 },
    { type: "LINK_REMINDER", linkId: "abc" },
    { type: "LINK_REMINDER", linkId: "../settings" },
  ])("형식이 다르면 무시한다: %p", (data) => {
    expect(getReminderLinkHref(data)).toBeNull();
  });
});

describe("setupNotifications", () => {
  test("앱 사용 중에 온 알림도 배너·목록·소리로 보여준다", async () => {
    setupNotifications();

    const handler = jest.mocked(setNotificationHandler).mock.calls[0]?.[0];
    await expect(
      handler?.handleNotification({} as never),
    ).resolves.toMatchObject({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
    });
  });

  test("안드로이드는 서버가 보내는 'reminder' 채널을 만든다", () => {
    mockPlatform.isAndroid = true;
    setupNotifications();

    expect(setNotificationChannelAsync).toHaveBeenCalledWith(
      "reminder",
      expect.objectContaining({ name: "리마인드 알림" }),
    );
  });

  test("iOS 는 채널을 만들지 않는다", () => {
    setupNotifications();

    expect(setNotificationChannelAsync).not.toHaveBeenCalled();
  });
});

describe("getDeviceNotificationPermission", () => {
  test("안드로이드는 리마인드 채널 상태까지 본다", async () => {
    mockPlatform.isAndroid = true;
    jest.mocked(getPermissionsAsync).mockResolvedValueOnce(GRANTED);
    jest
      .mocked(getNotificationChannelAsync)
      .mockResolvedValueOnce(channel(AndroidImportance.NONE));

    await expect(getDeviceNotificationPermission()).resolves.toBe("denied");
    expect(getNotificationChannelAsync).toHaveBeenCalledWith("reminder");
  });

  test("iOS 는 채널을 조회하지 않는다", async () => {
    jest.mocked(getPermissionsAsync).mockResolvedValueOnce(GRANTED);

    await expect(getDeviceNotificationPermission()).resolves.toBe("granted");
    expect(getNotificationChannelAsync).not.toHaveBeenCalled();
  });

  test("포그라운드 복귀 재조회를 위해 쿼리로도 읽힌다", async () => {
    jest.mocked(getPermissionsAsync).mockResolvedValueOnce(DENIED);

    await expect(
      queryClient.fetchQuery(notificationQueries.permission()),
    ).resolves.toBe("denied");
  });
});

describe("requestNotificationPermission", () => {
  test("OS 팝업 결과를 돌려주고 권한 쿼리에도 반영한다", async () => {
    jest.mocked(requestPermissionsAsync).mockResolvedValueOnce(GRANTED);
    jest.mocked(getPermissionsAsync).mockResolvedValueOnce(GRANTED);

    await expect(requestNotificationPermission()).resolves.toBe("granted");
    expect(
      queryClient.getQueryData(notificationQueries.permission().queryKey),
    ).toBe("granted");
  });
});

describe("requestNotificationPermissionOnce", () => {
  test("아직 묻지 않았으면 OS 팝업을 띄운다", async () => {
    jest.mocked(getPermissionsAsync).mockResolvedValueOnce(UNDETERMINED);

    await requestNotificationPermissionOnce();

    expect(requestPermissionsAsync).toHaveBeenCalledTimes(1);
  });

  test.each([
    GRANTED,
    DENIED,
  ])("이미 물어봤으면 다시 묻지 않는다", async (current) => {
    jest.mocked(getPermissionsAsync).mockResolvedValueOnce(current);

    await requestNotificationPermissionOnce();

    expect(requestPermissionsAsync).not.toHaveBeenCalled();
  });

  test("실패해도 던지지 않는다 — 리마인드 저장 흐름으로 번지지 않게", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    jest.mocked(getPermissionsAsync).mockRejectedValueOnce(new Error("boom"));

    await expect(requestNotificationPermissionOnce()).resolves.toBeUndefined();
    consoleError.mockRestore();
  });
});

describe("openNotificationSettings", () => {
  test("안드로이드는 앱 알림 설정 화면을 연다", async () => {
    mockPlatform.isAndroid = true;
    jest.mocked(startActivityAsync).mockResolvedValueOnce({ resultCode: 0 });

    await openNotificationSettings();

    expect(startActivityAsync).toHaveBeenCalledWith(
      "android.settings.APP_NOTIFICATION_SETTINGS",
      {
        extra: { "android.provider.extra.APP_PACKAGE": "com.mashup.promise9" },
      },
    );
  });

  test("안드로이드에서 열지 못하면 앱 설정으로 대신 연다", async () => {
    mockPlatform.isAndroid = true;
    const consoleWarn = jest.spyOn(console, "warn").mockImplementation();
    const openSettings = jest
      .spyOn(Linking, "openSettings")
      .mockResolvedValueOnce();
    jest
      .mocked(startActivityAsync)
      .mockRejectedValueOnce(new Error("ActivityNotFound"));

    await openNotificationSettings();

    expect(openSettings).toHaveBeenCalledTimes(1);
    consoleWarn.mockRestore();
  });

  test("iOS 는 앱 설정을 연다", async () => {
    const openSettings = jest
      .spyOn(Linking, "openSettings")
      .mockResolvedValueOnce();

    await openNotificationSettings();

    expect(openSettings).toHaveBeenCalledTimes(1);
    expect(startActivityAsync).not.toHaveBeenCalled();
  });
});

describe("useNotificationResponseNavigation", () => {
  test("로그인 상태에서 리마인드 알림을 누르면 링크 상세로 이동한다", async () => {
    jest
      .mocked(useLastNotificationResponse)
      .mockReturnValue(response({ type: "LINK_REMINDER", linkId: 7 }));

    await renderHook(() =>
      useNotificationResponseNavigation({ isReady: true, isSignedOut: false }),
    );

    expect(router.push).toHaveBeenCalledWith(linkDetailHref("7"));
    expect(clearLastNotificationResponse).toHaveBeenCalledTimes(1);
  });

  // 알림으로 앱을 켠 직후(인증 확인 중)엔 보호 라우트가 내비게이터에 없다 — 확인이 끝난 뒤 처리한다.
  test("인증 확인 중에는 이동하지 않고 응답을 남겨 둔다", async () => {
    jest
      .mocked(useLastNotificationResponse)
      .mockReturnValue(response({ type: "LINK_REMINDER", linkId: 7 }));

    await renderHook(() =>
      useNotificationResponseNavigation({ isReady: false, isSignedOut: false }),
    );

    expect(router.push).not.toHaveBeenCalled();
    expect(clearLastNotificationResponse).not.toHaveBeenCalled();
  });

  // 다음 로그인이 다른 계정일 수 있어 남겨 두지 않는다.
  test("로그아웃 상태면 이동하지 않고 응답을 버린다", async () => {
    jest
      .mocked(useLastNotificationResponse)
      .mockReturnValue(response({ type: "LINK_REMINDER", linkId: 7 }));

    await renderHook(() =>
      useNotificationResponseNavigation({ isReady: false, isSignedOut: true }),
    );

    expect(router.push).not.toHaveBeenCalled();
    expect(clearLastNotificationResponse).toHaveBeenCalledTimes(1);
  });

  test("형식이 다른 알림은 이동 없이 소비한다", async () => {
    jest
      .mocked(useLastNotificationResponse)
      .mockReturnValue(response({ linkId: "x" }));

    await renderHook(() =>
      useNotificationResponseNavigation({ isReady: true, isSignedOut: false }),
    );

    expect(router.push).not.toHaveBeenCalled();
    expect(clearLastNotificationResponse).toHaveBeenCalledTimes(1);
  });
});
