// @react-native-google-signin/google-signin jest stub
// 네이티브 SDK 라 jest 환경에서 실제 로그인이 동작할 수 없다 — 메서드를 jest.fn() 으로 노출해
// 각 테스트가 원하는 응답(success/cancelled/에러)을 mockResolvedValueOnce 등으로 지정한다.
const GoogleSignin = {
  configure: jest.fn(),
  hasPlayServices: jest.fn().mockResolvedValue(true),
  signIn: jest.fn(),
  signInSilently: jest.fn(),
  signOut: jest.fn(),
  revokeAccess: jest.fn(),
  hasPreviousSignIn: jest.fn(),
  getCurrentUser: jest.fn(),
  getTokens: jest.fn(),
};

const statusCodes = {
  SIGN_IN_CANCELLED: "SIGN_IN_CANCELLED",
  IN_PROGRESS: "IN_PROGRESS",
  PLAY_SERVICES_NOT_AVAILABLE: "PLAY_SERVICES_NOT_AVAILABLE",
  SIGN_IN_REQUIRED: "SIGN_IN_REQUIRED",
};

module.exports = { GoogleSignin, statusCodes };
