jest.mock("@shared/api", () => ({ getRefreshToken: jest.fn() }));

import { getRefreshToken } from "@shared/api";
import { renderHook, waitFor } from "@testing-library/react-native";

import { useAuthGate } from "./useAuthGate";

beforeEach(() => {
  (getRefreshToken as jest.Mock).mockReset();
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
