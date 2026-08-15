import { render, screen, userEvent } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";

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

describe("useSheetDismiss", () => {
  test("dismiss 를 호출하면 시트가 닫히고 onClose 가 불린다", async () => {
    const onClose = jest.fn();
    await render(
      <BottomSheet onClose={onClose}>
        <DismissButton />
      </BottomSheet>,
    );

    const user = userEvent.setup();
    await user.press(screen.getByText("닫기"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
