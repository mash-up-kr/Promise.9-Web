import { listLinks } from "@mocks/store";
import { setupMockApi } from "@mocks/testing";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { Suspense } from "react";

import { ArchiveDetailScreen } from "./ArchiveDetailScreen";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  Stack: { Screen: () => null },
  useLocalSearchParams: () => ({ id: "all" }),
  useRouter: () => ({ push: mockPush }),
}));

beforeEach(() => {
  mockPush.mockClear();
  setupMockApi();
});

const renderScreen = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={null}>
        <ArchiveDetailScreen />
      </Suspense>
    </QueryClientProvider>,
  );
};

describe("ArchiveDetailScreen", () => {
  test("폴더(전체) 내 스토어 링크 타일을 렌더한다", async () => {
    const first = listLinks().items[0];
    await renderScreen();
    expect(await screen.findByText(first.title)).toBeOnTheScreen();
  });

  test("링크를 누르면 링크 상세로 이동한다", async () => {
    const first = listLinks().items[0];
    await renderScreen();
    fireEvent.press(await screen.findByLabelText(first.title));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/link/[id]",
      params: { id: String(first.linkId) },
    });
  });
});
