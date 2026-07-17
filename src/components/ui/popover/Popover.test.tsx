import { fireEvent, render, screen } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { Popover } from "./Popover";

const renderPopover = () =>
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 375, height: 812 },
        insets: { top: 47, left: 0, right: 0, bottom: 34 },
      }}
    >
      <Popover
        anchor={{ top: 7, right: 9 }}
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
});
