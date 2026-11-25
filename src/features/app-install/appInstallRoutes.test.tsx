// expo-router 는 src/app/ 하위 전체를 라우트로 스캔하므로 라우트 테스트는 app/ 밖에 둔다.
let mockIsWeb = false;
jest.mock("@/constants/platform.constants", () => ({
  get isWeb() {
    return mockIsWeb;
  },
}));
const mockCanGoBack = jest.fn(() => false);
const mockBack = jest.fn();
const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    canGoBack: mockCanGoBack,
    back: mockBack,
    replace: mockReplace,
  }),
}));
const mockCloseSheet = jest.fn();
jest.mock("@/components/ui/sheet-screen/useSheetRouteNavigation", () => ({
  useSheetRouteNavigation: () => ({ closeSheet: mockCloseSheet }),
}));
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
  mockCloseSheet.mockClear();
  mockCanGoBack.mockReturnValue(false);
  mockBack.mockClear();
  mockReplace.mockClear();
});

// 앱 스킴으로 열리면 이미 설치된 것이라 설치 안내를 보여 줄 이유가 없다.
describe("앱 설치 라우트 — 네이티브", () => {
  // 앱을 이 주소로 처음 켜면 돌아갈 곳이 없다.
  test("/app 으로 앱을 켜면 로그인 상태는 홈으로 보낸다", async () => {
    await renderAppRoute("authenticated");
    expect(mockReplace).toHaveBeenCalledWith(ROUTES.HOME);
  });

  test("/app 으로 앱을 켜면 로그인 안 된 상태는 로그인으로 보낸다", async () => {
    await renderAppRoute("unauthenticated");
    expect(mockReplace).toHaveBeenCalledWith(ROUTES.LOGIN);
  });

  // 앱이 떠 있는 채로 열리면 홈으로 보내는 대신 이 화면만 닫는다(홈이 하나 더 쌓이지 않게).
  test("/app 은 앞 화면이 있으면 이 화면만 닫는다", async () => {
    mockCanGoBack.mockReturnValue(true);
    await renderAppRoute("authenticated");
    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  // 홈으로 Redirect 하면 모달 자리에 홈이 하나 더 쌓인다 — 이 라우트만 닫는다.
  test("/app-install 은 시트를 그리지 않고 이 라우트를 닫는다", async () => {
    await render(<AppInstallRoute />);
    expect(mockCloseSheet).toHaveBeenCalledTimes(1);
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
