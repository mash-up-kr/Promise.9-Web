// expo-notifications 는 네이티브 모듈이라 jest 환경에서 동작할 수 없다 — jest.fn() stub 으로 대체한다.
// enum 은 원본 값을 쓴다 — 매퍼는 패키지 루트만 가로채므로 build 하위 경로는 원본이 열린다.
const {
  AndroidImportance,
} = require("expo-notifications/build/NotificationChannelManager.types");
const {
  IosAuthorizationStatus,
} = require("expo-notifications/build/NotificationPermissions.types");

const undetermined = {
  status: "undetermined",
  granted: false,
  canAskAgain: true,
  expires: "never",
};

module.exports = {
  AndroidImportance,
  IosAuthorizationStatus,
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(null),
  getNotificationChannelAsync: jest.fn().mockResolvedValue(null),
  getPermissionsAsync: jest.fn().mockResolvedValue(undetermined),
  requestPermissionsAsync: jest.fn().mockResolvedValue(undetermined),
  useLastNotificationResponse: jest.fn().mockReturnValue(null),
  clearLastNotificationResponse: jest.fn(),
};
