// expo-router 는 src/app/ 하위 전체를 라우트로 스캔한다. 그 안에 .test.tsx 를 두면
// 실제 앱 실행 시 라우트로 import 돼 @testing-library 의 extend-expect 가 로드되며
// "expect is not defined" 로 크래시한다(선례: 커밋 5c0cf7b). 그래서 이 테스트는
// app/ 밖에 두고 라우트 파일을 직접 import 한다.
jest.mock("@/features/auth/hooks/useAuthGate", () => ({
  useAuthGate: jest.fn(),
}));

jest.mock("expo-router", () => {
  const { Text } = require("react-native");
  function Tabs({ children }: { children?: React.ReactNode }) {
    return children;
  }
  Tabs.Screen = () => null;
  return {
    Tabs,
    Redirect: ({ href }: { href: string }) => <Text>{`redirect:${href}`}</Text>,
    useRouter: () => ({ navigate: jest.fn() }),
  };
});

import { render, screen } from "@testing-library/react-native";

import TabsLayout from "@/app/(tabs)/_layout";
import { useAuthGate } from "@/features/auth/hooks/useAuthGate";

const mockUseAuthGate = useAuthGate as jest.Mock;

describe("TabsLayout — 인증 가드", () => {
  test("리프레시 토큰이 없으면(unauthenticated) 로그인으로 리다이렉트한다", async () => {
    mockUseAuthGate.mockReturnValue("unauthenticated");
    await render(<TabsLayout />);
    expect(screen.getByText("redirect:/login")).toBeOnTheScreen();
  });

  test("확인 중(checking)에는 리다이렉트하지 않고 빈 화면을 보여준다", async () => {
    mockUseAuthGate.mockReturnValue("checking");
    await render(<TabsLayout />);
    expect(screen.queryByText(/^redirect:/)).not.toBeOnTheScreen();
    expect(screen.getByTestId("auth-gate-checking")).toBeOnTheScreen();
  });

  test("인증된 상태(authenticated)에는 리다이렉트하지 않는다", async () => {
    mockUseAuthGate.mockReturnValue("authenticated");
    await render(<TabsLayout />);
    expect(screen.queryByText(/^redirect:/)).not.toBeOnTheScreen();
    expect(screen.queryByTestId("auth-gate-checking")).not.toBeOnTheScreen();
  });
});
