import { fireEvent, render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import { BottomSheet } from "./BottomSheet";

describe("BottomSheet", () => {
  test("children 을 렌더한다", async () => {
    await render(
      <BottomSheet onClose={jest.fn()}>
        <Text>내용</Text>
      </BottomSheet>,
    );
    expect(screen.getByText("내용")).toBeOnTheScreen();
  });

  test("시트가 닫히면 onClose 를 호출한다", async () => {
    const onClose = jest.fn();
    await render(
      <BottomSheet onClose={onClose}>
        <Text>내용</Text>
      </BottomSheet>,
    );
    fireEvent.press(screen.getByLabelText("sheet-dismiss"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
