let mockScreenFocus: () => void = () => {};
jest.mock("expo-router", () => ({
  useFocusEffect: (effect: () => void) => {
    mockScreenFocus = effect;
    require("react").useEffect(() => effect(), [effect]);
  },
}));

import { focusManager } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react-native";

import { useRefocusEffect } from "./useRefocusEffect";

afterEach(() => focusManager.setFocused(undefined));

test("처음 화면에 들어올 때는 부르지 않고, 다시 들어오면 부른다", async () => {
  const onRefocus = jest.fn();
  await renderHook(() => useRefocusEffect(onRefocus));
  expect(onRefocus).not.toHaveBeenCalled();

  mockScreenFocus();
  expect(onRefocus).toHaveBeenCalledTimes(1);
});

test("앱으로 돌아오면 부른다", async () => {
  const onRefocus = jest.fn();
  await renderHook(() => useRefocusEffect(onRefocus));

  focusManager.setFocused(false);
  focusManager.setFocused(true);
  expect(onRefocus).toHaveBeenCalledTimes(1);
});
