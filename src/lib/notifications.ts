import AsyncStorage from "@react-native-async-storage/async-storage";
import { setSessionRejectedHandler } from "@shared/api";
import { putPushToken } from "@shared/entities/user/user.pushToken.api";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { withTimeout } from "es-toolkit";
import Constants from "expo-constants";
import { ActivityAction, startActivityAsync } from "expo-intent-launcher";
import {
  AndroidImportance,
  clearLastNotificationResponse,
  getExpoPushTokenAsync,
  getNotificationChannelAsync,
  getPermissionsAsync,
  IosAuthorizationStatus,
  type NotificationChannel,
  type NotificationPermissionsStatus,
  requestPermissionsAsync,
  setNotificationChannelAsync,
  setNotificationHandler,
  useLastNotificationResponse,
} from "expo-notifications";
import { router } from "expo-router";
import { useEffect } from "react";
import { Linking } from "react-native";
import { z } from "zod";
import { isAndroid } from "@/constants/platform.constants";
import { linkDetailHref } from "@/constants/routes.constants";
import { flushPendingLogout, sendLogout } from "@/lib/pendingLogout";
import { queryClient } from "@/lib/queryClient";

// 서버 리마인드 발송과 맞춘 값.
const REMINDER_CHANNEL_ID = "reminder";

// 마지막으로 서버에 등록한 토큰 — 앱을 다시 실행해도 로그아웃 때 해제할 수 있게 기기에 남긴다.
export const PUSH_TOKEN_STORAGE_KEY = "push-token";
const REGISTRATION_WAIT_MS = 3000;

// 토큰 발급은 리마인드 채널 생성이 끝난 뒤에 한다.
let deviceSetup: Promise<unknown> = Promise.resolve();
let pendingRegistration: Promise<void> = Promise.resolve();

export type DeviceNotificationPermission =
  | "granted"
  | "denied"
  | "undetermined";

export function setupNotifications(): void {
  setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      // 안드로이드는 소리를 끄면 배너도 뜨지 않는다.
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  // 권한 요청·토큰 발급보다 먼저 있어야 해 앱 시작 시 만든다.
  if (isAndroid) {
    deviceSetup = setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
      name: "리마인드 알림",
      importance: AndroidImportance.HIGH,
    }).catch((error) => {
      console.error("[notifications] 리마인드 채널 생성 실패", error);
    });
  }
  // 서버는 세션 만료만으로 푸시 토큰을 지우지 않는다 — 로그인이 끝난 기기로 알림이 가지 않게 직접 해제한다.
  setSessionRejectedHandler(async (refreshToken) => {
    const pushToken = await takePushToken();
    if (pushToken) await sendLogout({ refreshToken, pushToken });
  });
}

export function toDeviceNotificationPermission(
  permissions: NotificationPermissionsStatus,
  reminderChannel: NotificationChannel | null,
): DeviceNotificationPermission {
  // iOS 는 임시 권한(provisional)을 루트 status 'undetermined' 로 준다.
  if (
    permissions.granted ||
    permissions.ios?.status === IosAuthorizationStatus.PROVISIONAL
  ) {
    return reminderChannel?.importance === AndroidImportance.NONE
      ? "denied"
      : "granted";
  }
  return permissions.status === "undetermined" ? "undetermined" : "denied";
}

export async function getDeviceNotificationPermission(): Promise<DeviceNotificationPermission> {
  const [permissions, reminderChannel] = await Promise.all([
    getPermissionsAsync(),
    isAndroid ? getNotificationChannelAsync(REMINDER_CHANNEL_ID) : null,
  ]);
  return toDeviceNotificationPermission(permissions, reminderChannel);
}

export const notificationQueries = {
  // 시스템 설정에서 바꾸고 돌아오면 포커스 재조회(lib/focus-manager)로 다시 읽힌다.
  permission: () =>
    queryOptions({
      queryKey: ["notification", "permission"] as const,
      queryFn: getDeviceNotificationPermission,
    }),
};

export async function requestNotificationPermission(): Promise<DeviceNotificationPermission> {
  await requestPermissionsAsync();
  const permission = await getDeviceNotificationPermission();
  queryClient.setQueryData(
    notificationQueries.permission().queryKey,
    permission,
  );
  return permission;
}

/** 리마인드를 저장할 때 묻는다 — 이미 답했으면 다시 묻지 않고, 실패해도 저장 흐름으로 번지지 않는다. */
export async function requestNotificationPermissionOnce(): Promise<void> {
  try {
    if ((await getDeviceNotificationPermission()) === "undetermined") {
      await requestNotificationPermission();
    }
  } catch (error) {
    console.error("[notifications] 알림 권한 요청 실패", error);
  }
}

/**
 * OS 의 링띵동 알림 설정을 연다. 안드로이드는 앱 알림 설정 화면, iOS 는 앱 설정 화면 —
 * iOS 16+ 의 알림 설정 직행 URL(openNotificationSettingsURLString)은 RN 이 노출하지 않고 값도 문서화돼 있지 않다.
 */
export async function openNotificationSettings(): Promise<void> {
  const packageName = Constants.expoConfig?.android?.package;
  if (isAndroid && packageName) {
    try {
      await startActivityAsync(ActivityAction.APP_NOTIFICATION_SETTINGS, {
        extra: { "android.provider.extra.APP_PACKAGE": packageName },
      });
      return;
    } catch (error) {
      console.warn(
        "[notifications] 앱 알림 설정을 열지 못해 앱 설정을 연다",
        error,
      );
    }
  }
  await Linking.openSettings();
}

const reminderPushDataSchema = z.object({
  type: z.literal("LINK_REMINDER"),
  linkId: z.union([
    z.number().int().positive(),
    z.string().regex(/^[1-9]\d*$/),
  ]),
});

export function getReminderLinkHref(data: unknown) {
  const parsed = reminderPushDataSchema.safeParse(data);
  return parsed.success ? linkDetailHref(String(parsed.data.linkId)) : null;
}

export interface NotificationTapGate {
  /** 내비게이터가 뜨고 로그인됨 */
  isReady: boolean;
  /** 로그아웃 상태로 확정됨 */
  isSignedOut: boolean;
}

/**
 * 알림 탭(실행 중·백그라운드·종료 상태 모두)을 링크 상세로 잇는다.
 * 인증 확인 중의 탭은 남겨 뒀다가 준비되면 처리하고, 로그아웃 상태의 탭은 버린다(다음 로그인이 다른 계정일 수 있다).
 */
export function useNotificationResponseNavigation({
  isReady,
  isSignedOut,
}: NotificationTapGate): void {
  const response = useLastNotificationResponse();
  useEffect(() => {
    if (!response || !(isReady || isSignedOut)) return;
    clearLastNotificationResponse();
    if (isSignedOut) return;
    const href = getReminderLinkHref(
      response.notification.request.content.data,
    );
    if (href) router.push(href);
  }, [response, isReady, isSignedOut]);
}

/** 실패는 삼킨다 — 다음 트리거(로그인·앱 실행·권한 허용)에서 다시 등록된다. */
export function registerPushToken(): Promise<void> {
  pendingRegistration = registerPushTokenOnce();
  return pendingRegistration;
}

async function registerPushTokenOnce(): Promise<void> {
  try {
    await deviceSetup;
    // 같은 계정으로 다시 로그인했을 때 늦게 보낸 이전 로그아웃이 이번 등록을 지우지 않게 먼저 보낸다.
    await flushPendingLogout();
    const { data: token } = await getExpoPushTokenAsync();
    await putPushToken({ token, platform: isAndroid ? "android" : "ios" });
    await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);
  } catch (error) {
    console.warn("[notifications] 푸시 토큰 등록 실패", error);
  }
}

/**
 * 로그아웃 요청에 실을 이 기기의 푸시 토큰을 꺼낸다(서버가 로그아웃과 함께 지운다). 진행 중인 등록은 잠깐만 기다린다.
 * ponytail: 등록이 기다림보다 늦게 끝나면 그 토큰은 로그아웃에 실리지 않아 이전 계정에 남는다 — 다음 로그인의 등록(토큰 기준 upsert)이 새 계정으로 옮긴다.
 */
export async function takePushToken(): Promise<string | null> {
  await withTimeout(() => pendingRegistration, REGISTRATION_WAIT_MS).catch(() =>
    console.warn("[notifications] 푸시 토큰 등록을 기다리지 않고 로그아웃"),
  );
  try {
    const token = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
    if (token) await AsyncStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
    return token;
  } catch (error) {
    console.warn("[notifications] 푸시 토큰 읽기 실패", error);
    return null;
  }
}

/**
 * 로그인돼 있고 알림이 허용돼 있으면 서버에 토큰을 등록한다 — 로그인·앱 실행·권한 허용(팝업·OS 설정 후 포커스 재조회) 때.
 * 앱이 시작되면 지난번에 못 보낸 로그아웃(이 기기 토큰 삭제)도 보낸다.
 */
export function usePushTokenSync(isSignedIn: boolean): void {
  const { data: permission } = useQuery(
    { ...notificationQueries.permission(), enabled: isSignedIn },
    queryClient,
  );

  useEffect(() => {
    void flushPendingLogout();
  }, []);

  useEffect(() => {
    if (isSignedIn && permission === "granted") registerPushToken();
  }, [isSignedIn, permission]);
}
