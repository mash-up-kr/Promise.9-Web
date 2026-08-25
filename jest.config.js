/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  // 테스트가 아직 없는 초기 상태에서 `pnpm test` 가 실패하지 않도록.
  passWithNoTests: true,
  // E2E(Playwright, e2e/*.spec.ts)는 jest 가 아니라 playwright 가 실행한다.
  // .claude/ 는 에이전트 worktree(.claude/worktrees/)가 생겨 테스트가 중복 실행되므로 제외한다.
  testPathIgnorePatterns: ["/node_modules/", "/e2e/", "/.claude/"],
  moduleNameMapper: {
    // jest-expo 는 tsconfig 의 `@/*` 만 보고 `@/(.*)` → `src/$1` 매퍼를 만들어서
    // 더 구체적인 `@/assets/*` → `assets/*` 를 덮어쓴다. 그보다 먼저 잡아준다.
    "^@/assets/(.*)$": "<rootDir>/assets/$1",
    // reanimated 4.x 는 react-native-worklets 네이티브 초기화를 필요로 하므로
    // jest 환경에서는 자체 stub 으로 대체한다.
    "^react-native-reanimated$":
      "<rootDir>/src/__mocks__/react-native-reanimated.js",
    // keyboard-controller 는 네이티브 바인딩을 직접 참조하므로 jest 용 stub 으로 대체한다.
    "^react-native-keyboard-controller$":
      "<rootDir>/src/__mocks__/react-native-keyboard-controller.js",
    // expo-blur 의 NativeBlurView 는 네이티브 뷰라 jest 에서 못 그린다 → stub 으로 대체.
    "^expo-blur$": "<rootDir>/src/__mocks__/expo-blur.js",
    // gesture-handler 는 네이티브 바인딩에 의존하므로 렌더 stub 으로 대체한다.
    "^react-native-gesture-handler$":
      "<rootDir>/src/__mocks__/react-native-gesture-handler.js",
    // gorhom 시트는 reanimated/gesture-handler 네이티브에 의존하므로 stub 으로 대체한다.
    "^@gorhom/bottom-sheet$": "<rootDir>/src/__mocks__/@gorhom/bottom-sheet.js",
    // 구글 로그인 SDK 는 네이티브 모듈이라 jest 환경에서 동작할 수 없다 — jest.fn() stub 으로 대체.
    "^@react-native-google-signin/google-signin$":
      "<rootDir>/src/__mocks__/@react-native-google-signin/google-signin.js",
    // 카카오 로그인 SDK 도 네이티브 모듈이라 jest 환경에서 동작할 수 없다 — jest.fn() stub 으로 대체.
    "^@react-native-seoul/kakao-login$":
      "<rootDir>/src/__mocks__/@react-native-seoul/kakao-login.js",
    // 애플 로그인 SDK 도 네이티브 모듈이라 jest 환경에서 동작할 수 없다 — jest.fn() stub 으로 대체.
    "^expo-apple-authentication$":
      "<rootDir>/src/__mocks__/expo-apple-authentication.js",
  },
};
