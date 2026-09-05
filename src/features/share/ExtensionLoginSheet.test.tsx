jest.mock("expo-share-extension", () => ({
  close: jest.fn(),
  openHostApp: jest.fn(),
}));
// requireActual("./useExtensionSocialLogin") 가 auth.queries 를 통해 @shared/api 를
// 끌어오므로, EXPO_PUBLIC_API_BASE_URL 을 요구하는 실 client.ts 를 피하려 함께 목킹한다.
jest.mock("@shared/api", () => {
  const token = jest.requireActual("@shared/api/token");
  const contracts = jest.requireActual("@shared/api/auth.contracts");
  const errors = jest.requireActual("@shared/api/errors");
  return {
    apiClient: { get: jest.fn(), post: jest.fn() },
    ...token,
    ...contracts,
    ...errors,
  };
});
const mockLogin = jest.fn();
let mockLoginState = {
  pendingProvider: null as string | null,
  errorMessage: null as string | null,
};
jest.mock("./useExtensionSocialLogin", () => ({
  ...jest.requireActual("./useExtensionSocialLogin"),
  useExtensionSocialLogin: () => ({ login: mockLogin, ...mockLoginState }),
}));
jest.mock("@/constants/platform.constants", () => ({
  isIOS: true,
  isAndroid: false,
  isWeb: false,
}));

import { render, screen, userEvent } from "@testing-library/react-native";

import { ExtensionLoginSheet } from "./ExtensionLoginSheet";
import { EXTENSION_LOGIN_FAILED_MESSAGE } from "./useExtensionSocialLogin";

beforeEach(() => {
  mockLogin.mockReset();
  mockLoginState = { pendingProvider: null, errorMessage: null };
});

test("제목·안내와 소셜 버튼(카카오→구글→애플)을 보여준다", async () => {
  await render(
    <ExtensionLoginSheet
      sharedUrl="https://toss.tech/a"
      isSessionExpired={false}
    />,
  );

  expect(screen.getByText("로그인이 필요해요")).toBeOnTheScreen();
  expect(
    screen.getByText("로그인하면 이 링크를 바로 저장할 수 있어요"),
  ).toBeOnTheScreen();
  const labels = ["카카오로 계속하기", "Google로 계속하기", "Apple로 계속하기"];
  for (const label of labels) {
    expect(screen.getByText(label)).toBeOnTheScreen();
  }
});

test("세션이 만료된 경우 안내 문구가 바뀐다", async () => {
  await render(
    <ExtensionLoginSheet sharedUrl="https://toss.tech/a" isSessionExpired />,
  );
  expect(screen.getByText("다시 로그인해주세요")).toBeOnTheScreen();
});

test("버튼을 누르면 해당 provider 로 로그인을 시작한다", async () => {
  await render(
    <ExtensionLoginSheet
      sharedUrl="https://toss.tech/a"
      isSessionExpired={false}
    />,
  );

  await userEvent.setup().press(screen.getByText("Google로 계속하기"));

  expect(mockLogin).toHaveBeenCalledWith("google");
});

test("오류 문구가 있으면 시트 안에 보여준다", async () => {
  mockLoginState = {
    pendingProvider: null,
    errorMessage: EXTENSION_LOGIN_FAILED_MESSAGE,
  };
  await render(
    <ExtensionLoginSheet
      sharedUrl="https://toss.tech/a"
      isSessionExpired={false}
    />,
  );
  expect(screen.getByText(EXTENSION_LOGIN_FAILED_MESSAGE)).toBeOnTheScreen();
});
