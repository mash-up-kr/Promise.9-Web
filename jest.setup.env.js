// 테스트에서 client.ts 가 EXPO_PUBLIC_API_BASE_URL 없어 throw 하지 않도록 기본값 주입.
// (실제 요청은 mocks/testing 의 setupMockApi 로 가로챈다.)
process.env.EXPO_PUBLIC_API_BASE_URL ??= "https://mock.test/api/v1";
