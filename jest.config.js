/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  // 테스트가 아직 없는 초기 상태에서 `pnpm test` 가 실패하지 않도록.
  passWithNoTests: true,
  // E2E(Playwright, e2e/*.spec.ts)는 jest 가 아니라 playwright 가 실행한다.
  testPathIgnorePatterns: ["/node_modules/", "/e2e/"],
  moduleNameMapper: {
    // reanimated 4.x 는 react-native-worklets 네이티브 초기화를 필요로 하므로
    // jest 환경에서는 자체 stub 으로 대체한다.
    "^react-native-reanimated$":
      "<rootDir>/src/__mocks__/react-native-reanimated.js",
    // keyboard-controller 는 네이티브 바인딩을 직접 참조하므로 jest 용 stub 으로 대체한다.
    "^react-native-keyboard-controller$":
      "<rootDir>/src/__mocks__/react-native-keyboard-controller.js",
  },
};
