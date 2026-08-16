import { fireEvent, render, screen } from "@testing-library/react-native";
import * as ReactNative from "react-native";
import { Pressable, StyleSheet, Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { CONTENT_MAX_WIDTH } from "@/constants/layout.constants";

import { Popover } from "./Popover";

// useWindowDimensions 는 내부적으로 Dimensions.get("window") 을 읽으므로 그걸 mock 한다.
const mockWindowWidth = (width: number) =>
  jest.spyOn(ReactNative.Dimensions, "get").mockReturnValue({
    width,
    height: 1000,
    scale: 1,
    fontScale: 1,
  });

const renderPopover = () =>
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 375, height: 812 },
        insets: { top: 47, left: 0, right: 0, bottom: 34 },
      }}
    >
      <Popover
        anchor={{ right: 9 }}
        trigger={(open) => (
          <Pressable accessibilityLabel="열기" onPress={open}>
            <Text>열기</Text>
          </Pressable>
        )}
      >
        {(close) => (
          <Pressable accessibilityLabel="항목" onPress={close}>
            <Text>내용</Text>
          </Pressable>
        )}
      </Popover>
    </SafeAreaProvider>,
  );

describe("Popover", () => {
  test("처음에는 내용이 보이지 않는다", async () => {
    await renderPopover();
    expect(screen.queryByText("내용")).toBeNull();
  });

  test("트리거를 누르면 내용이 나타난다", async () => {
    await renderPopover();
    await fireEvent.press(screen.getByLabelText("열기"));
    expect(screen.getByText("내용")).toBeOnTheScreen();
  });

  test("백드롭을 누르면 닫힌다", async () => {
    await renderPopover();
    await fireEvent.press(screen.getByLabelText("열기"));
    await fireEvent.press(screen.getByLabelText("메뉴 닫기"));
    expect(screen.queryByText("내용")).toBeNull();
  });

  test("children 의 close 를 호출하면 닫힌다", async () => {
    await renderPopover();
    await fireEvent.press(screen.getByLabelText("열기"));
    await fireEvent.press(screen.getByLabelText("항목"));
    expect(screen.queryByText("내용")).toBeNull();
  });

  // 패널은 화면 전체를 덮는 Modal 안에 있어 top 이 화면 절대 좌표다. safe-area 를 빼면
  // 그만큼 위로 올라가 헤더를 덮는다.
  test("트리거를 재기 전에도 safe-area 아래에 뜬다", async () => {
    await renderPopover();
    await fireEvent.press(screen.getByLabelText("열기"));
    const style = StyleSheet.flatten(
      screen.getByTestId("popover-panel").props.style,
    );

    expect(style.top).toBeGreaterThanOrEqual(47);
  });

  describe("가장자리(right) 위치 보정", () => {
    afterEach(() => jest.restoreAllMocks());

    test("모바일(윈도우 ≤ 컬럼 폭)에서는 anchor.right 를 그대로 쓴다", async () => {
      mockWindowWidth(375);
      await renderPopover();
      await fireEvent.press(screen.getByLabelText("열기"));
      const style = StyleSheet.flatten(
        screen.getByTestId("popover-panel").props.style,
      );
      expect(style.right).toBe(9);
    });

    test("웹(윈도우 > 컬럼 폭)에서는 중앙 컬럼 가장자리에 맞춰 offset 을 더한다", async () => {
      const windowWidth = CONTENT_MAX_WIDTH + 432;
      mockWindowWidth(windowWidth);
      await renderPopover();
      await fireEvent.press(screen.getByLabelText("열기"));
      const style = StyleSheet.flatten(
        screen.getByTestId("popover-panel").props.style,
      );
      // anchor.right(9) + (윈도우 - 컬럼 폭) / 2
      expect(style.right).toBe(9 + (windowWidth - CONTENT_MAX_WIDTH) / 2);
    });
  });
});
