const mockPlatform = { isAndroid: false };

import AsyncStorage from "@react-native-async-storage/async-storage";
import { setSessionRejectedHandler } from "@shared/api";
import { putPushToken } from "@shared/entities/user/user.pushToken.api";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { PermissionStatus } from "expo";
import { startActivityAsync } from "expo-intent-launcher";
import {
  AndroidImportance,
  clearLastNotificationResponse,
  getExpoPushTokenAsync,
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
import { flushPendingLogout, sendLogout } from "@/lib/pendingLogout";
import { queryClient } from "@/lib/queryClient";

import {
  getDeviceNotificationPermission,
  getReminderLinkHref,
  notificationQueries,
  openNotificationSettings,
  PUSH_TOKEN_STORAGE_KEY,
  registerPushToken,
  requestNotificationPermission,
  requestNotificationPermissionOnce,
  setupNotifications,
  takePushToken,
  toDeviceNotificationPermission,
  useNotificationResponseNavigation,
  usePushTokenSync,
} from "./notifications";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("@/constants/platform.constants", () => ({
  get isAndroid() {
    return mockPlatform.isAndroid;
  },
}));
jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { android: { package: "com.mashup.promise9" } } },
}));
jest.mock("@shared/entities/user/user.pushToken.api", () => ({
  putPushToken: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@/lib/pendingLogout", () => ({
  flushPendingLogout: jest.fn().mockResolvedValue(undefined),
  sendLogout: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@shared/api", () => ({ setSessionRejectedHandler: jest.fn() }));
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

beforeEach(async () => {
  jest.clearAllMocks();
  mockPlatform.isAndroid = false;
  queryClient.clear();
  await AsyncStorage.clear();
});

// 마지막 테스트의 쿼리 gc 타이머가 남아 jest 가 끝나지 않는다.
afterAll(() => queryClient.clear());

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

  test("세션이 거절돼 로그아웃되면 거절된 토큰으로 이 기기의 푸시 토큰을 지운다", async () => {
    await AsyncStorage.setItem(
      PUSH_TOKEN_STORAGE_KEY,
      "ExpoPushToken[device-1]",
    );
    setupNotifications();

    jest.mocked(setSessionRejectedHandler).mock.calls[0]?.[0]?.("rtk-expired");

    await waitFor(() =>
      expect(sendLogout).toHaveBeenCalledWith({
        refreshToken: "rtk-expired",
        pushToken: "ExpoPushToken[device-1]",
      }),
    );
  });

  test("세션이 거절돼도 등록한 푸시 토큰이 없으면 로그아웃을 보내지 않는다", async () => {
    setupNotifications();

    jest.mocked(setSessionRejectedHandler).mock.calls[0]?.[0]?.("rtk-expired");

    await waitFor(() => expect(AsyncStorage.getItem).toHaveBeenCalled());
    await act(async () => {});
    expect(sendLogout).not.toHaveBeenCalled();
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

const EXPO_TOKEN = "ExpoPushToken[device-1]";

function deferred() {
  let resolve: () => void = () => {};
  const promise = new Promise<null>((done) => {
    resolve = () => done(null);
  });
  return { promise, resolve };
}

describe("registerPushToken", () => {
  beforeEach(() => {
    jest
      .mocked(getExpoPushTokenAsync)
      .mockResolvedValue({ type: "expo", data: EXPO_TOKEN });
  });

  test("Expo 푸시 토큰을 발급받아 서버에 등록한다", async () => {
    await registerPushToken();

    expect(putPushToken).toHaveBeenCalledWith({
      token: EXPO_TOKEN,
      platform: "ios",
    });
  });

  test("안드로이드는 리마인드 채널이 만들어진 뒤에 토큰을 발급받는다", async () => {
    mockPlatform.isAndroid = true;
    const channelCreation = deferred();
    jest
      .mocked(setNotificationChannelAsync)
      .mockReturnValueOnce(channelCreation.promise);
    setupNotifications();

    const registering = registerPushToken();
    await act(async () => {});
    expect(getExpoPushTokenAsync).not.toHaveBeenCalled();

    channelCreation.resolve();
    await registering;
    expect(putPushToken).toHaveBeenCalledWith({
      token: EXPO_TOKEN,
      platform: "android",
    });
  });

  // 같은 계정으로 다시 로그인했을 때 늦게 보낸 이전 로그아웃이 새 등록을 지우지 않게 한다.
  test("등록 전에 남은 로그아웃 요청부터 보낸다", async () => {
    await registerPushToken();

    expect(
      jest.mocked(flushPendingLogout).mock.invocationCallOrder[0],
    ).toBeLessThan(jest.mocked(putPushToken).mock.invocationCallOrder[0] ?? 0);
  });

  // 다음 트리거(앱 실행·로그인·권한 허용)에서 다시 시도된다.
  test("실패해도 던지지 않는다", async () => {
    const consoleWarn = jest.spyOn(console, "warn").mockImplementation();
    jest.mocked(putPushToken).mockRejectedValueOnce(new Error("offline"));

    await expect(registerPushToken()).resolves.toBeUndefined();
    consoleWarn.mockRestore();
  });
});

describe("takePushToken", () => {
  beforeEach(() => {
    jest
      .mocked(getExpoPushTokenAsync)
      .mockResolvedValue({ type: "expo", data: EXPO_TOKEN });
  });

  test("이 기기에 등록한 토큰을 한 번만 꺼낸다", async () => {
    await registerPushToken();

    await expect(takePushToken()).resolves.toBe(EXPO_TOKEN);
    await expect(takePushToken()).resolves.toBeNull();
  });

  test("이번 실행에 등록하지 않았어도 지난 실행에 등록한 토큰을 꺼낸다", async () => {
    await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, EXPO_TOKEN);

    await expect(takePushToken()).resolves.toBe(EXPO_TOKEN);
  });

  test("등록 중이면 등록이 끝난 뒤 그 토큰을 꺼낸다", async () => {
    const registration = deferred();
    jest
      .mocked(putPushToken)
      .mockReturnValueOnce(registration.promise.then(() => undefined));
    const registering = registerPushToken();
    await act(async () => {});

    const taking = takePushToken();
    registration.resolve();
    await registering;

    await expect(taking).resolves.toBe(EXPO_TOKEN);
  });

  // 로그아웃은 "빠져나가기"라 등록 지연으로 붙잡지 않는다.
  test("등록이 3초 안에 끝나지 않으면 기다리지 않는다", async () => {
    jest.mocked(putPushToken).mockReturnValueOnce(new Promise(() => {}));
    jest.useFakeTimers();
    void registerPushToken();

    const taking = takePushToken();
    await jest.advanceTimersByTimeAsync(3000);

    await expect(taking).resolves.toBeNull();
    jest.useRealTimers();
  });
});

describe("usePushTokenSync", () => {
  beforeEach(() => {
    jest
      .mocked(getExpoPushTokenAsync)
      .mockResolvedValue({ type: "expo", data: EXPO_TOKEN });
  });

  // 로그아웃한 채로 다시 켠 앱도 지난번에 못 보낸 로그아웃(푸시 토큰 삭제)을 마저 보낸다.
  test("로그인하지 않았어도 앱이 시작되면 남은 로그아웃 요청을 보낸다", async () => {
    await renderHook(() => usePushTokenSync(false));

    expect(flushPendingLogout).toHaveBeenCalledTimes(1);
  });

  test("로그인 상태에서 알림이 허용돼 있으면 토큰을 등록한다", async () => {
    jest.mocked(getPermissionsAsync).mockResolvedValue(GRANTED);

    await renderHook(() => usePushTokenSync(true));

    await waitFor(() => expect(putPushToken).toHaveBeenCalledTimes(1));
  });

  test("알림이 허용되지 않았으면 등록하지 않는다", async () => {
    jest.mocked(getPermissionsAsync).mockResolvedValue(DENIED);

    await renderHook(() => usePushTokenSync(true));

    await waitFor(() => expect(getPermissionsAsync).toHaveBeenCalled());
    await act(async () => {});
    expect(getExpoPushTokenAsync).not.toHaveBeenCalled();
  });

  // 권한 팝업 결과(requestNotificationPermission)와 OS 설정에서 돌아온 뒤의 포커스 재조회가 모두 이 쿼리를 바꾼다.
  test("권한이 허용으로 바뀌면 바로 등록한다", async () => {
    jest.mocked(getPermissionsAsync).mockResolvedValue(DENIED);
    await renderHook(() => usePushTokenSync(true));
    await waitFor(() => expect(getPermissionsAsync).toHaveBeenCalled());

    await act(async () => {
      queryClient.setQueryData(
        notificationQueries.permission().queryKey,
        "granted",
      );
    });

    await waitFor(() => expect(putPushToken).toHaveBeenCalledTimes(1));
  });

  test("로그인 상태가 아니면 아무것도 하지 않는다", async () => {
    await renderHook(() => usePushTokenSync(false));

    await act(async () => {});
    expect(getPermissionsAsync).not.toHaveBeenCalled();
  });
});
