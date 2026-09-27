// expo-router 는 src/app/ 하위 전체를 라우트로 스캔하므로 라우트 테스트는 app/ 밖에 둔다(tabsLayoutAuthGate 와 같은 이유).
jest.mock("@/features/auth/hooks/useAuthGate", () => ({
  useAuthGate: jest.fn(),
}));

const mockParams = jest.fn();
jest.mock("expo-router", () => {
  const { Text } = require("react-native");
  return {
    Redirect: ({ href }: { href: unknown }) => (
      <Text>{`redirect:${JSON.stringify(href)}`}</Text>
    ),
    useLocalSearchParams: () => mockParams(),
  };
});

jest.mock("@/features/link/CreateLinkSheet", () => {
  const { Text } = require("react-native");
  return { CreateLinkSheet: () => <Text>create-link-sheet</Text> };
});

import { render, screen } from "@testing-library/react-native";

import CreateLinkRoute from "@/app/create-link";
import { useAuthGate } from "@/features/auth/hooks/useAuthGate";

const mockUseAuthGate = useAuthGate as jest.Mock;

beforeEach(() => {
  mockParams.mockReturnValue({});
});

// 공유 익스텐션의 "앱에서 직접 입력" 딥링크는 (tabs) 가드를 거치지 않고 이 오버레이 라우트를 바로 연다.
describe("create-link 라우트 — 인증 가드", () => {
  test("로그인 안 된 상태면 공유 URL 을 들고 로그인으로 보낸다", async () => {
    mockUseAuthGate.mockReturnValue("unauthenticated");
    mockParams.mockReturnValue({ share: "6162" });
    await render(<CreateLinkRoute />);
    expect(
      screen.getByText(
        'redirect:{"pathname":"/login","params":{"next":"create-link","share":"6162"}}',
      ),
    ).toBeOnTheScreen();
    expect(screen.queryByText("create-link-sheet")).not.toBeOnTheScreen();
  });

  test("공유 URL 없이 열렸어도 로그인 뒤 빈 저장 시트로 돌아오게 next 만 붙인다", async () => {
    mockUseAuthGate.mockReturnValue("unauthenticated");
    await render(<CreateLinkRoute />);
    expect(
      screen.getByText(
        'redirect:{"pathname":"/login","params":{"next":"create-link"}}',
      ),
    ).toBeOnTheScreen();
  });

  test("확인 중에는 시트도 리다이렉트도 그리지 않는다", async () => {
    mockUseAuthGate.mockReturnValue("checking");
    await render(<CreateLinkRoute />);
    expect(screen.queryByText(/^redirect:/)).not.toBeOnTheScreen();
    expect(screen.queryByText("create-link-sheet")).not.toBeOnTheScreen();
  });

  test("로그인된 상태면 저장 시트를 그린다", async () => {
    mockUseAuthGate.mockReturnValue("authenticated");
    await render(<CreateLinkRoute />);
    expect(screen.getByText("create-link-sheet")).toBeOnTheScreen();
    expect(screen.queryByText(/^redirect:/)).not.toBeOnTheScreen();
  });
});
