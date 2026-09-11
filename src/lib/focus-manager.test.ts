import { focusManager } from "@tanstack/react-query";
import { AppState, type AppStateStatus } from "react-native";

import { setupFocusManager } from "./focus-manager";

// 네이티브는 window focus 이벤트가 없어 AppState 로 포커스를 판단한다 — 공유 익스텐션에서
// 저장하고 앱으로 돌아오면(active) 화면 쿼리가 다시 조회돼야 한다.
test("앱이 백그라운드로 가면 비포커스, 다시 활성화되면 포커스로 본다", () => {
  const addListener = jest.spyOn(AppState, "addEventListener");
  setupFocusManager();
  const unsubscribe = focusManager.subscribe(() => {});

  const handleChange = addListener.mock.calls.find(
    ([type]) => type === "change",
  )?.[1] as ((status: AppStateStatus) => void) | undefined;
  expect(handleChange).toBeDefined();

  handleChange?.("background");
  expect(focusManager.isFocused()).toBe(false);

  handleChange?.("active");
  expect(focusManager.isFocused()).toBe(true);

  unsubscribe();
});
