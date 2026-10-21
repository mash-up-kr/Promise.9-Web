// expo-router 는 src/app/ 하위 전체를 라우트로 스캔하므로 라우트 테스트는 app/ 밖에 둔다(createLinkRouteAuthGate 와 같은 이유).
jest.mock("@/features/auth/hooks/useAuthGate", () => ({
  useAuthGate: jest.fn(),
}));
// client.ts 는 import 시 EXPO_PUBLIC_API_BASE_URL 를 요구한다 — 루트 레이아웃이 쓰는 토큰 저장소 주입만 실제 구현으로 둔다.
jest.mock("@shared/api", () => ({
  ...jest.requireActual("@shared/api/token"),
  apiClient: { get: jest.fn(), post: jest.fn() },
}));
// 루트 레이아웃이 불러오는 전역 CSS 는 jest 가 파싱하지 못한다.
jest.mock("@/global.css", () => ({}));
// 루트의 업데이트 안내가 안내 기록(AsyncStorage)을 읽는다 — 네이티브 저장소 대신 공식 jest mock.
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
// 네트워크·포커스 배선은 네이티브 리스너라 jest 에 없다 — 이 테스트의 관심사도 아니다.
jest.mock("@/lib/online-manager", () => ({ setupOnlineManager: jest.fn() }));
jest.mock("@/lib/focus-manager", () => ({ setupFocusManager: jest.fn() }));
// 폰트·스플래시는 보호 라우트 테스트의 관심사가 아니다 — 기본은 바로 초기화된 것으로 두고
// 폰트 게이트 테스트만 결과를 바꾼다.
const mockUseFonts = jest.fn((): [boolean, Error | null] => [true, null]);
jest.mock("expo-font", () => ({
  useFonts: () => mockUseFonts(),
}));
jest.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));
jest.mock("@/features/splash/hooks/useSplashPhase", () => ({
  useSplashPhase: jest.fn(() => "hidden"),
}));
jest.mock("@/features/splash/components/SplashOverlay", () => ({
  SplashOverlay: () => null,
}));
// 업데이트 안내는 스플래시가 걷힌 뒤에만 보이는지만 본다 — 안내 자체는 AppNoticeGate.test 가 지킨다.
jest.mock("@/features/app-notice/AppNoticeGate", () => {
  const { createElement } = require("react");
  const { Text } = require("react-native");
  return {
    AppNoticeGate: ({ isVisible }: { isVisible: boolean }) =>
      isVisible ? createElement(Text, null, "app-notice-gate") : null,
  };
});

import { userEvent } from "@testing-library/react-native";
import { Slot } from "expo-router";
import { renderRouter, screen } from "expo-router/testing-library";
import { Text } from "react-native";
import RootLayout from "@/app/_layout";
import NotFoundRoute from "@/app/+not-found";
import AuthLayout from "@/app/(auth)/_layout";
import { useAuthGate } from "@/features/auth/hooks/useAuthGate";
import { useSplashPhase } from "@/features/splash/hooks/useSplashPhase";

const mockUseAuthGate = jest.mocked(useAuthGate);
const mockUseSplashPhase = jest.mocked(useSplashPhase);

const label = (name: string) => () => <Text>{name}</Text>;

// 루트 Stack 이 선언하는 라우트 전부 — 선언만 하고 실제 파일이 없으면 expo-router 가 경고한다.
// 보호 라우트가 빠져 첫 화면이 바뀐 경우 expo-router 의 경로 정보(store)는 내비게이션 액션 전까지
// 초기 URL 상태에 머문다 — 로그아웃 케이스는 그려진 화면으로 단언한다.
const routes = {
  _layout: RootLayout,
  // 그룹은 레이아웃 파일이 있어야 루트 Stack 의 자식 이름((tabs)·(auth))으로 잡힌다.
  "(tabs)/_layout": Slot,
  "(tabs)/index": label("home"),
  // (auth) 는 실제 레이아웃(Stack) — Slot 이면 중첩 상태가 없어 경로가 "/login" 이 아니라 "/" 로 잡힌다.
  "(auth)/_layout": AuthLayout,
  "(auth)/login": label("login"),
  "create-link": label("create-link"),
  "create-folder": label("create-folder"),
  "edit-folder": label("edit-folder"),
  "move-links": label("move-links"),
  "link/[id]": label("link"),
  "archive/[id]": label("archive-detail"),
  "search/index": label("search"),
  "settings/privacy": label("privacy"),
  "settings/terms": label("terms"),
  "settings/withdraw": label("withdraw"),
  support: label("support"),
  "+not-found": NotFoundRoute,
};

// 앱 스킴으로는 (tabs) 밖 라우트도 바로 열린다 — 어느 라우트로 들어오든 로그인 안 된 상태면 로그인이 먼저다.
describe("RootLayout — 보호 라우트", () => {
  test("로그인 안 된 상태에서 보호 라우트로 딥링크하면 로그인 화면이 뜬다", async () => {
    mockUseAuthGate.mockReturnValue("unauthenticated");
    await renderRouter(routes, { initialUrl: "/link/1" });
    expect(await screen.findByText("login")).toBeOnTheScreen();
    expect(screen.queryByText("link")).not.toBeOnTheScreen();
  });

  test("로그인 안 된 상태에서 홈으로 시작해도 로그인 화면이 뜬다", async () => {
    mockUseAuthGate.mockReturnValue("unauthenticated");
    await renderRouter(routes, { initialUrl: "/" });
    expect(await screen.findByText("login")).toBeOnTheScreen();
    expect(screen.queryByText("home")).not.toBeOnTheScreen();
  });

  test("로그인된 상태면 보호 라우트가 그대로 열린다", async () => {
    mockUseAuthGate.mockReturnValue("authenticated");
    const result = renderRouter(routes, { initialUrl: "/link/1" });
    await result;
    expect(await screen.findByText("link")).toBeOnTheScreen();
    expect(result.getPathname()).toBe("/link/1");
  });

  test("로그인된 상태의 시작 화면은 홈이다", async () => {
    mockUseAuthGate.mockReturnValue("authenticated");
    const result = renderRouter(routes, { initialUrl: "/" });
    await result;
    expect(await screen.findByText("home")).toBeOnTheScreen();
    expect(result.getPathname()).toBe("/");
  });

  // 확인 중에 내비게이터를 띄우면 로그인이 첫 화면으로 잡혀 인증 뒤에도 거기 머문다.
  test("인증 확인 중에는 어떤 화면도 그리지 않는다", async () => {
    mockUseAuthGate.mockReturnValue("checking");
    await renderRouter(routes, { initialUrl: "/" });
    expect(screen.queryByText("home")).not.toBeOnTheScreen();
    expect(screen.queryByText("login")).not.toBeOnTheScreen();
  });

  // 로그인 화면의 약관·개인정보처리방침 링크는 로그인 전에 눌린다.
  test("약관 화면은 로그인 안 된 상태에서도 열린다", async () => {
    mockUseAuthGate.mockReturnValue("unauthenticated");
    await renderRouter(routes, { initialUrl: "/settings/terms" });
    expect(await screen.findByText("terms")).toBeOnTheScreen();
  });

  // 공유 익스텐션 딥링크는 공유 URL 을 next 로 들고 로그인으로 가야 해서 보호 밖에 두고 라우트가 직접 가른다(create-link.tsx).
  test("저장 시트 라우트는 로그인 안 된 상태에서도 라우트 자신이 열린다", async () => {
    mockUseAuthGate.mockReturnValue("unauthenticated");
    await renderRouter(routes, { initialUrl: "/create-link?share=6162" });
    expect(await screen.findByText("create-link")).toBeOnTheScreen();
  });
});

// 폰트가 안 와도 앱이 멈추면 안 된다 — 실패는 시스템 폰트로 진입한다(#144).
describe("RootLayout — 폰트 게이트", () => {
  afterEach(() => {
    mockUseFonts.mockReturnValue([true, null]);
  });

  test("폰트 로드가 실패해도 로그인 화면이 뜬다", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockUseAuthGate.mockReturnValue("unauthenticated");
    mockUseFonts.mockReturnValue([false, new Error("ERR_DOWNLOAD")]);

    await renderRouter(routes, { initialUrl: "/" });

    expect(await screen.findByText("login")).toBeOnTheScreen();
    errorSpy.mockRestore();
  });

  test("네이티브는 폰트 로드 전에는 어떤 화면도 그리지 않는다", async () => {
    mockUseAuthGate.mockReturnValue("unauthenticated");
    mockUseFonts.mockReturnValue([false, null]);

    await renderRouter(routes, { initialUrl: "/" });

    expect(screen.queryByText("login")).not.toBeOnTheScreen();
  });
});

describe("RootLayout — 없는 경로", () => {
  test.each([
    "authenticated",
    "unauthenticated",
  ] as const)("%s 상태에서 없는 경로로 들어오면 404 화면이 뜬다", async (status) => {
    mockUseAuthGate.mockReturnValue(status);
    await renderRouter(routes, { initialUrl: "/no-such-page" });
    expect(
      await screen.findByText("페이지를 찾을 수 없어요"),
    ).toBeOnTheScreen();
  });

  test("로그인 안 된 상태에서 404 의 로그인하러 가기를 누르면 로그인 화면이 뜬다", async () => {
    mockUseAuthGate.mockReturnValue("unauthenticated");
    const user = userEvent.setup();
    await renderRouter(routes, { initialUrl: "/no-such-page" });

    await user.press(
      await screen.findByRole("button", { name: "로그인하러 가기" }),
    );

    expect(await screen.findByText("login")).toBeOnTheScreen();
  });
});

// 업데이트 안내는 자체 Modal 이라 스플래시 오버레이보다 위에 그려진다 — 스플래시가 걷힌 뒤에 띄운다.
describe("RootLayout — 업데이트 안내", () => {
  afterEach(() => {
    mockUseSplashPhase.mockReturnValue("hidden");
  });

  test("스플래시가 걷히기 전에는 업데이트 안내를 보이지 않는다", async () => {
    mockUseAuthGate.mockReturnValue("authenticated");
    mockUseSplashPhase.mockReturnValue("shown");
    await renderRouter(routes, { initialUrl: "/" });
    expect(await screen.findByText("home")).toBeOnTheScreen();
    expect(screen.queryByText("app-notice-gate")).not.toBeOnTheScreen();
  });

  test("스플래시가 걷히면 업데이트 안내를 보인다", async () => {
    mockUseAuthGate.mockReturnValue("authenticated");
    await renderRouter(routes, { initialUrl: "/" });
    expect(await screen.findByText("app-notice-gate")).toBeOnTheScreen();
  });
});
