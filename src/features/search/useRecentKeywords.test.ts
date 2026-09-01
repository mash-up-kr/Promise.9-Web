jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, renderHook, waitFor } from "@testing-library/react-native";

import { useRecentKeywords } from "./useRecentKeywords";

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

test("저장돼 있던 최근 검색어를 불러온다", async () => {
  await AsyncStorage.setItem(
    "search.recentKeywords",
    JSON.stringify(["피그마", "면접"]),
  );

  const { result } = await renderHook(() => useRecentKeywords());

  await waitFor(() =>
    expect(result.current.keywords).toEqual(["피그마", "면접"]),
  );
});

test("검색어를 추가하면 목록 맨 앞에 반영되고 영속화된다", async () => {
  const { result } = await renderHook(() => useRecentKeywords());

  await act(async () => {
    result.current.addKeyword("사우나");
  });

  expect(result.current.keywords).toEqual(["사우나"]);
  await waitFor(async () => {
    expect(await AsyncStorage.getItem("search.recentKeywords")).toBe(
      JSON.stringify(["사우나"]),
    );
  });
});

test("모두 지우면 목록과 저장소가 함께 비워진다", async () => {
  await AsyncStorage.setItem(
    "search.recentKeywords",
    JSON.stringify(["피그마"]),
  );
  const { result } = await renderHook(() => useRecentKeywords());
  await waitFor(() => expect(result.current.keywords).toEqual(["피그마"]));

  await act(async () => {
    result.current.clearKeywords();
  });

  expect(result.current.keywords).toEqual([]);
  await waitFor(async () => {
    expect(await AsyncStorage.getItem("search.recentKeywords")).toBeNull();
  });
});

test("저장 값이 깨져 있으면 빈 목록으로 시작한다", async () => {
  const spy = jest.spyOn(console, "error").mockImplementation(() => {});
  await AsyncStorage.setItem("search.recentKeywords", "not-json{");

  const { result } = await renderHook(() => useRecentKeywords());

  await waitFor(() => expect(result.current.keywords).toEqual([]));
  spy.mockRestore();
});
