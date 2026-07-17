import { fireEvent, render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import {
  Input,
  InputField,
  InputSlot,
  inputFieldStyles,
  inputStyles,
} from "./Input";

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

  test("pill(Search) placeholder 는 gray-400(text-assistive)", async () => {
    await render(
      <Input variant="pill">
        <InputField placeholder="입력" />
      </Input>,
    );
    expect(screen.getByPlaceholderText("입력").props.placeholderTextColor).toBe(
      "#65656b",
    );
  });

  test("field(Default) placeholder 는 white-30", async () => {
    await render(
      <Input variant="field">
        <InputField placeholder="폴더" />
      </Input>,
    );
    expect(screen.getByPlaceholderText("폴더").props.placeholderTextColor).toBe(
      "#ffffff4d",
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
  test("pill(Search) 변형은 완전 둥근 pill · #26262b 배경이다", () => {
    const cls = inputStyles({ variant: "pill" });
    expect(cls).toContain("rounded-full");
    expect(cls).toContain("h-10");
    expect(cls).toContain("bg-background-input");
  });

  test("field(Default) 변형은 radius 20 · white-10 배경이다", () => {
    const cls = inputStyles({ variant: "field" });
    expect(cls).toContain("rounded-[20px]");
    expect(cls).toContain("bg-opacity-white-10");
    expect(cls).not.toContain("rounded-full");
  });
});

describe("InputField 타입별 폰트 스펙", () => {
  test("field(Default) 는 Pretendard Regular 14(body-2-reading)", () => {
    const cls = inputFieldStyles({ variant: "field" });
    expect(cls).toContain("font-pretendard");
    expect(cls).not.toContain("font-pretendard-medium");
    expect(cls).toContain("text-body-2-reading");
    expect(cls).toContain("text-text-normal");
  });

  test("pill(Search) 는 Pretendard Medium 16(heading-3)", () => {
    const cls = inputFieldStyles({ variant: "pill" });
    expect(cls).toContain("font-pretendard-medium");
    expect(cls).toContain("text-heading-3");
    expect(cls).toContain("text-text-normal");
  });
});
