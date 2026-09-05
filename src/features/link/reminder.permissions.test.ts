jest.mock("expo-notifications", () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
}));

import * as Notifications from "expo-notifications";

import { requestReminderPermission } from "./reminder.permissions";

const mockGetPermissions = Notifications.getPermissionsAsync as jest.Mock;
const mockRequestPermissions =
  Notifications.requestPermissionsAsync as jest.Mock;

afterEach(() => {
  jest.clearAllMocks();
  globalThis.__promise9ShareExtension = undefined;
});

test("미요청 상태면 OS 권한 다이얼로그를 요청한다", async () => {
  mockGetPermissions.mockResolvedValue({ status: "undetermined" });
  await requestReminderPermission();
  expect(mockRequestPermissions).toHaveBeenCalledTimes(1);
});

test("이미 결정된 상태면 다시 묻지 않는다", async () => {
  mockGetPermissions.mockResolvedValue({ status: "denied" });
  await requestReminderPermission();
  expect(mockRequestPermissions).not.toHaveBeenCalled();
});

test("iOS 공유 익스텐션 프로세스에서는 권한 조회조차 하지 않는다", async () => {
  globalThis.__promise9ShareExtension = true;
  await requestReminderPermission();
  expect(mockGetPermissions).not.toHaveBeenCalled();
  expect(mockRequestPermissions).not.toHaveBeenCalled();
});
