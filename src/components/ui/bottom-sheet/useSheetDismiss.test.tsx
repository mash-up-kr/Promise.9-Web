import { render, screen, userEvent } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";

import { type Metrics, SafeAreaProvider } from "react-native-safe-area-context";

import { BottomSheet } from "./BottomSheet";
import { useSheetDismiss } from "./useSheetDismiss";

function DismissButton() {
  const dismiss = useSheetDismiss();
  return (
    <Pressable accessibilityRole="button" onPress={dismiss}>
      <Text>닫기</Text>
    </Pressable>
  );
}

const metrics: Metrics = {
  frame: { x: 0, y: 0, width: 375, height: 812 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

describe("useSheetDismiss", () => {
  test("dismiss 를 호출하면 시트가 닫히고 onClose 가 불린다", async () => {
    const onClose = jest.fn();
    await render(
      <SafeAreaProvider initialMetrics={metrics}>
        <BottomSheet onClose={onClose}>
          <DismissButton />
        </BottomSheet>
      </SafeAreaProvider>,
    );

    const user = userEvent.setup();
    await user.press(screen.getByText("닫기"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
