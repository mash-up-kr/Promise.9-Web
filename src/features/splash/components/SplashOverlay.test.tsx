jest.mock("expo-splash-screen", () => ({ hideAsync: jest.fn() }));

import { fireEvent, render, screen } from "@testing-library/react-native";
import * as SplashScreen from "expo-splash-screen";

import { SplashOverlay } from "./SplashOverlay";

beforeEach(() => {
  (SplashScreen.hideAsync as jest.Mock).mockClear();
});

test("마스코트 이미지를 렌더한다", async () => {
  await render(<SplashOverlay isFadingOut={false} />);
  expect(screen.getByTestId("splash-mascot")).toBeOnTheScreen();
});

test("첫 레이아웃 시 네이티브 스플래시를 숨긴다", async () => {
  await render(<SplashOverlay isFadingOut={false} />);
  fireEvent(screen.getByTestId("splash-overlay"), "layout");
  expect(SplashScreen.hideAsync).toHaveBeenCalled();
});

test("노출 중에는 아래 화면으로의 터치를 막는다", async () => {
  await render(<SplashOverlay isFadingOut={false} />);
  expect(screen.getByTestId("splash-overlay").props.pointerEvents).toBe("auto");
});

test("페이드 아웃 중에는 터치를 통과시킨다", async () => {
  await render(<SplashOverlay isFadingOut />);
  expect(screen.getByTestId("splash-overlay").props.pointerEvents).toBe("none");
});
