// expo-apple-authentication jest stub
// 네이티브 SDK 라 jest 환경에서 실제 로그인이 동작할 수 없다 — signInAsync 를 jest.fn() 으로 노출해
// 각 테스트가 원하는 응답(identityToken/누락/취소)을 mockResolvedValueOnce 등으로 지정한다.
module.exports = {
  signInAsync: jest.fn(),
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
  AppleAuthenticationButton: () => null,
};
