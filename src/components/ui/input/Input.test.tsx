import { fireEvent, render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import { Input, InputField, InputSlot } from "./Input";

describe("Input", () => {
  test("슬롯과 필드를 함께 렌더한다", async () => {
    await render(
      <Input>
        <InputSlot>
          <Text>아이콘</Text>
        </InputSlot>
        <InputField placeholder="입력" />
      </Input>,
    );
    expect(screen.getByText("아이콘")).toBeOnTheScreen();
    expect(screen.getByPlaceholderText("입력")).toBeOnTheScreen();
  });

  test("InputField 는 입력 값을 onChangeText 로 전달한다", async () => {
    const onChangeText = jest.fn();
    await render(
      <Input>
        <InputField placeholder="입력" onChangeText={onChangeText} />
      </Input>,
    );
    fireEvent.changeText(screen.getByPlaceholderText("입력"), "값");
    expect(onChangeText).toHaveBeenCalledWith("값");
  });

  test("InputField 는 placeholder 색 기본값(text-assistive)을 가진다", async () => {
    await render(
      <Input>
        <InputField placeholder="입력" />
      </Input>,
    );
    expect(screen.getByPlaceholderText("입력").props.placeholderTextColor).toBe(
      "#65656b",
    );
  });

  test("InputSlot 은 onPress 를 지원한다", async () => {
    const onPress = jest.fn();
    await render(
      <Input>
        <InputSlot onPress={onPress} accessibilityLabel="지우기">
          <Text>X</Text>
        </InputSlot>
        <InputField placeholder="입력" />
      </Input>,
    );
    fireEvent.press(screen.getByLabelText("지우기"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
