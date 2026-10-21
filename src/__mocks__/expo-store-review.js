// expo-store-review 는 네이티브 모듈(SKStoreReviewController · Play ReviewManager)이라
// jest 환경에서 동작할 수 없다 — jest.fn() stub 으로 대체한다.
module.exports = {
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  hasAction: jest.fn().mockResolvedValue(true),
  requestReview: jest.fn().mockResolvedValue(undefined),
  storeUrl: jest.fn().mockReturnValue(null),
};
