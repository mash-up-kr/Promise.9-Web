import { queryOptions } from "@tanstack/react-query";
import Constants from "expo-constants";
import { ActivityAction, startActivityAsync } from "expo-intent-launcher";
import {
  AndroidImportance,
  clearLastNotificationResponse,
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
import { queryClient } from "@/lib/queryClient";

// 서버 리마인드 발송과 맞춘 값.
const REMINDER_CHANNEL_ID = "reminder";

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
    setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
      name: "리마인드 알림",
      importance: AndroidImportance.HIGH,
    }).catch((error) => {
      console.error("[notifications] 리마인드 채널 생성 실패", error);
    });
  }
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

/**
 * 알림 탭(실행 중·백그라운드·종료 상태 모두)을 링크 상세로 잇는다.
 * `isReady`(내비게이터가 뜨고 로그인됨) 전의 탭은 남겨 뒀다가 그 뒤에 처리한다.
 */
export function useNotificationResponseNavigation(isReady: boolean): void {
  const response = useLastNotificationResponse();
  useEffect(() => {
    if (!response || !isReady) return;
    clearLastNotificationResponse();
    const href = getReminderLinkHref(
      response.notification.request.content.data,
    );
    if (href) router.push(href);
  }, [response, isReady]);
}
