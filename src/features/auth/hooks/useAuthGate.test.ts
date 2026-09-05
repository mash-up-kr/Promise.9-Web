jest.mock("@shared/api", () => ({
  getRefreshToken: jest.fn(),
  subscribeTokens: jest.fn(),
}));

import { getRefreshToken, subscribeTokens } from "@shared/api";
import { act, renderHook, waitFor } from "@testing-library/react-native";

import { useAuthGate } from "./useAuthGate";

const mockGetRefreshToken = getRefreshToken as jest.Mock;
const mockSubscribe = subscribeTokens as jest.Mock;
let notify: () => void = () => {};
const unsubscribe = jest.fn();

beforeEach(() => {
  mockGetRefreshToken.mockReset();
  unsubscribe.mockReset();
  mockSubscribe.mockImplementation((listener: () => void) => {
    notify = listener;
    return unsubscribe;
  });
});

test("확인 중에는 checking 을 반환한다", async () => {
  (getRefreshToken as jest.Mock).mockReturnValue(new Promise(() => {}));
  const { result } = await renderHook(() => useAuthGate());
  expect(result.current).toBe("checking");
});

test("저장된 리프레시 토큰이 있으면 authenticated 를 반환한다", async () => {
  (getRefreshToken as jest.Mock).mockResolvedValue("rtk-1");
  const { result } = await renderHook(() => useAuthGate());
  await waitFor(() => expect(result.current).toBe("authenticated"));
});

test("저장된 리프레시 토큰이 없으면 unauthenticated 를 반환한다", async () => {
  (getRefreshToken as jest.Mock).mockResolvedValue(null);
  const { result } = await renderHook(() => useAuthGate());
  await waitFor(() => expect(result.current).toBe("unauthenticated"));
});

test("토큰 변경 알림이 오면 다시 읽어 상태를 갱신한다", async () => {
  mockGetRefreshToken.mockResolvedValue(null);
  const { result } = await renderHook(() => useAuthGate());
  await waitFor(() => expect(result.current).toBe("unauthenticated"));

  mockGetRefreshToken.mockResolvedValue("rtk");
  await act(async () => {
    notify();
  });

  await waitFor(() => expect(result.current).toBe("authenticated"));
});

test("언마운트 시 구독을 해제한다", async () => {
  mockGetRefreshToken.mockResolvedValue("rtk");
  const { unmount } = await renderHook(() => useAuthGate());
  await act(async () => {
    unmount();
  });
  expect(unsubscribe).toHaveBeenCalled();
});

test("조회가 겹치면 늦게 끝난 이전 결과가 최신 상태를 덮어쓰지 않는다", async () => {
  let resolveFirst: (token: string | null) => void = () => {};
  mockGetRefreshToken.mockReturnValueOnce(
    new Promise<string | null>((resolve) => {
      resolveFirst = resolve;
    }),
  );
  const { result } = await renderHook(() => useAuthGate());
  expect(result.current).toBe("checking");

  mockGetRefreshToken.mockResolvedValueOnce(null);
  await act(async () => {
    notify();
  });
  await waitFor(() => expect(result.current).toBe("unauthenticated"));

  await act(async () => {
    resolveFirst("stale-rtk");
  });
  expect(result.current).toBe("unauthenticated");
});

test("토큰 조회가 실패하면 unauthenticated 로 본다", async () => {
  const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  mockGetRefreshToken.mockRejectedValue(new Error("keychain"));
  const { result } = await renderHook(() => useAuthGate());

  await waitFor(() => expect(result.current).toBe("unauthenticated"));
  errorSpy.mockRestore();
});
