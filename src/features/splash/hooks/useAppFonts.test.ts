import { renderHook } from "@testing-library/react-native";

const mockUseFonts = jest.fn();
jest.mock("expo-font", () => ({
  useFonts: (map: unknown) => mockUseFonts(map),
}));

import { useAppFonts } from "./useAppFonts";

beforeEach(() => {
  mockUseFonts.mockReset();
});

test("폰트가 로드되면 진입할 수 있다", async () => {
  mockUseFonts.mockReturnValue([true, null]);
  const { result } = await renderHook(() => useAppFonts());
  expect(result.current).toBe(true);
});

test("네이티브는 폰트 로드 전에는 진입하지 않는다", async () => {
  mockUseFonts.mockReturnValue([false, null]);
  const { result } = await renderHook(() => useAppFonts());
  expect(result.current).toBe(false);
});

test("폰트 로드가 실패해도 진입하고 실패는 로그로 남긴다", async () => {
  const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  const error = new Error("ERR_DOWNLOAD");
  mockUseFonts.mockReturnValue([false, error]);

  const { result } = await renderHook(() => useAppFonts());

  expect(result.current).toBe(true);
  expect(errorSpy).toHaveBeenCalledWith(expect.any(String), error);
  errorSpy.mockRestore();
});

test("토큰이 쓰는 Pretendard 굵기별 family 4종을 등록한다", async () => {
  mockUseFonts.mockReturnValue([true, null]);
  await renderHook(() => useAppFonts());

  const map = mockUseFonts.mock.calls[0][0] as Record<string, unknown>;
  expect(Object.keys(map).sort()).toEqual([
    "Pretendard",
    "Pretendard-Bold",
    "Pretendard-Medium",
    "Pretendard-SemiBold",
  ]);
});
