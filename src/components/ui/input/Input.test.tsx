import { fireEvent, render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import { Input, InputField, InputSlot, inputStyles } from "./Input";

describe("Input", () => {
  test("슬롯과 필드를 함께 렌더한다", async () => {
    await render(
      <Input variant="pill">
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
      <Input variant="pill">
        <InputField placeholder="입력" onChangeText={onChangeText} />
      </Input>,
    );
    fireEvent.changeText(screen.getByPlaceholderText("입력"), "값");
    expect(onChangeText).toHaveBeenCalledWith("값");
  });

  test("InputField 커서는 디자인 스펙(흰색)을 따른다", async () => {
    await render(
      <Input variant="pill">
        <InputField placeholder="입력" />
      </Input>,
    );
    const field = screen.getByPlaceholderText("입력");
    expect(field.props.cursorColor).toBe("#ffffff");
    expect(field.props.selectionColor).toBe("#ffffff");
  });

  test("InputField 는 placeholder 색 기본값(text-assistive)을 가진다", async () => {
    await render(
      <Input variant="pill">
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
      <Input variant="pill">
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

describe("Input variant", () => {
  test("pill 변형은 완전 둥근 pill 형태다", () => {
    const cls = inputStyles({ variant: "pill" });
    expect(cls).toContain("rounded-full");
    expect(cls).toContain("h-10");
  });

  test("field 변형은 저장시트용 라운드 사각형이다", () => {
    const cls = inputStyles({ variant: "field" });
    expect(cls).toContain("rounded-2xl");
    expect(cls).not.toContain("rounded-full");
  });
});
