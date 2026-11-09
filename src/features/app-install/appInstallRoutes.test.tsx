// expo-router 는 src/app/ 하위 전체를 라우트로 스캔하므로 라우트 테스트는 app/ 밖에 둔다.
let mockIsWeb = false;
jest.mock("@/constants/platform.constants", () => ({
  get isWeb() {
    return mockIsWeb;
  },
}));
jest.mock("expo-router", () => {
  const { Text } = require("react-native");
  return {
    Redirect: ({ href }: { href: unknown }) => (
      <Text>{`redirect:${JSON.stringify(href)}`}</Text>
    ),
  };
});
jest.mock("@/features/app-install/AppInstallSheet", () => {
  const { Text } = require("react-native");
  return { AppInstallSheet: () => <Text>app-install-sheet</Text> };
});
jest.mock("@/features/app-install/AppDownloadScreen", () => {
  const { Text } = require("react-native");
  return { AppDownloadScreen: () => <Text>app-download-screen</Text> };
});

import { render, screen } from "@testing-library/react-native";

import AppRoute from "@/app/app";
import AppInstallRoute from "@/app/app-install";
import { ROUTES } from "@/constants/routes.constants";
import { AuthGateProvider } from "@/features/auth/AuthGateContext";
import type { AuthGateStatus } from "@/features/auth/hooks/useAuthGate";

function renderAppRoute(status: AuthGateStatus) {
  return render(
    <AuthGateProvider status={status}>
      <AppRoute />
    </AuthGateProvider>,
  );
}

afterEach(() => {
  mockIsWeb = false;
});

// 앱 스킴으로 열리면 이미 설치된 것이라 설치 안내를 보여 줄 이유가 없다.
describe("앱 설치 라우트 — 네이티브", () => {
  test("/app 은 로그인 상태면 홈으로 보낸다", async () => {
    await renderAppRoute("authenticated");
    expect(
      screen.getByText(`redirect:${JSON.stringify(ROUTES.HOME)}`),
    ).toBeOnTheScreen();
  });

  test("/app 은 로그인 안 된 상태면 로그인으로 보낸다", async () => {
    await renderAppRoute("unauthenticated");
    expect(
      screen.getByText(`redirect:${JSON.stringify(ROUTES.LOGIN)}`),
    ).toBeOnTheScreen();
  });

  test("/app-install 은 시트 대신 홈으로 보낸다", async () => {
    await render(<AppInstallRoute />);
    expect(
      screen.getByText(`redirect:${JSON.stringify(ROUTES.HOME)}`),
    ).toBeOnTheScreen();
    expect(screen.queryByText("app-install-sheet")).not.toBeOnTheScreen();
  });
});

describe("앱 설치 라우트 — 웹", () => {
  test("/app 은 설치 안내 화면을 그린다", async () => {
    mockIsWeb = true;
    await renderAppRoute("unauthenticated");
    expect(screen.getByText("app-download-screen")).toBeOnTheScreen();
  });

  test("/app-install 은 설치 시트를 그린다", async () => {
    mockIsWeb = true;
    await render(<AppInstallRoute />);
    expect(screen.getByText("app-install-sheet")).toBeOnTheScreen();
  });
});
