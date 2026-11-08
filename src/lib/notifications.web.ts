import { queryOptions } from "@tanstack/react-query";

import type { DeviceNotificationPermission } from "./notifications";

// 웹에는 푸시가 없다 — 네이티브 모듈이 웹 번들에 섞이지 않게 같은 이름만 두고 아무것도 하지 않는다.

export type { DeviceNotificationPermission };

export function setupNotifications(): void {}

export async function getDeviceNotificationPermission(): Promise<DeviceNotificationPermission> {
  return "denied";
}

export const notificationQueries = {
  permission: () =>
    queryOptions({
      queryKey: ["notification", "permission"] as const,
      queryFn: getDeviceNotificationPermission,
    }),
};

export const requestNotificationPermission = getDeviceNotificationPermission;

export async function requestNotificationPermissionOnce(): Promise<void> {}

export async function openNotificationSettings(): Promise<void> {}

export function useNotificationResponseNavigation(_isReady: boolean): void {}
