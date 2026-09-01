const mockNavigate = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ navigate: mockNavigate }),
}));

const mockResetShareIntent = jest.fn();
interface MockShareIntentState {
  hasShareIntent: boolean;
  shareIntent: { webUrl: string | null; text: string | null };
  resetShareIntent: jest.Mock;
}
let mockShareIntentState: MockShareIntentState;
jest.mock("expo-share-intent", () => ({
  useShareIntentContext: () => mockShareIntentState,
}));

import { renderHook } from "@testing-library/react-native";

import { useShareIntentRedirect } from "./useShareIntentRedirect";

beforeEach(() => {
  mockNavigate.mockClear();
  mockResetShareIntent.mockClear();
  mockShareIntentState = {
    hasShareIntent: false,
    shareIntent: { webUrl: null, text: null },
    resetShareIntent: mockResetShareIntent,
  };
});

test("공유 URL 을 받으면 sharedUrl 과 함께 저장 시트로 이동하고 intent 를 비운다", async () => {
  mockShareIntentState = {
    hasShareIntent: true,
    shareIntent: { webUrl: "https://toss.tech/a", text: "https://toss.tech/a" },
    resetShareIntent: mockResetShareIntent,
  };

  await renderHook(() => useShareIntentRedirect());

  expect(mockNavigate).toHaveBeenCalledWith({
    pathname: "/create-link",
    params: { sharedUrl: "https://toss.tech/a" },
  });
  expect(mockResetShareIntent).toHaveBeenCalled();
});

test("webUrl 이 없으면 공유된 text 를 URL 로 사용한다", async () => {
  mockShareIntentState = {
    hasShareIntent: true,
    shareIntent: { webUrl: null, text: "https://example.com/b" },
    resetShareIntent: mockResetShareIntent,
  };

  await renderHook(() => useShareIntentRedirect());

  expect(mockNavigate).toHaveBeenCalledWith({
    pathname: "/create-link",
    params: { sharedUrl: "https://example.com/b" },
  });
});

test("공유 intent 가 없으면 아무 동작도 하지 않는다", async () => {
  await renderHook(() => useShareIntentRedirect());

  expect(mockNavigate).not.toHaveBeenCalled();
  expect(mockResetShareIntent).not.toHaveBeenCalled();
});
