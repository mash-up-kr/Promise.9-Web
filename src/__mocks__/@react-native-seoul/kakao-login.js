// @react-native-seoul/kakao-login jest stub
// 네이티브 SDK 라 jest 환경에서 실제 로그인이 동작할 수 없다 — login 을 jest.fn() 으로 노출해
// 각 테스트가 원하는 응답(성공/idToken 누락/실패)을 mockResolvedValueOnce 등으로 지정한다.
module.exports = {
  login: jest.fn(),
  loginWithKakaoAccount: jest.fn(),
  logout: jest.fn(),
  unlink: jest.fn(),
  getProfile: jest.fn(),
  getAccessToken: jest.fn(),
};
