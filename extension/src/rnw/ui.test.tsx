import { ActionButton } from "@promise9/ui/action-button/ActionButton";
import { Radio, RadioGroup, RadioLabel } from "@promise9/ui/radio/Radio";
import { Text } from "@promise9/ui/text/Text";
import { Toggle } from "@promise9/ui/toggle/Toggle";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

describe("@promise9/ui 를 익스텐션(react-native-web)에서", () => {
  it("ActionButton 을 role·이름으로 찾고 누를 수 있다", async () => {
    const onPress = vi.fn();
    render(<ActionButton onPress={onPress}>저장</ActionButton>);

    await userEvent.click(screen.getByRole("button", { name: "저장" }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("disabled·loading 버튼은 비활성이고 로딩은 progressbar 를 보인다", () => {
    render(
      <>
        <ActionButton disabled>비활성</ActionButton>
        <ActionButton isLoading>로딩</ActionButton>
      </>,
    );

    expect(screen.getByRole("button", { name: "비활성" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "로딩" })).toBeDisabled();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("Toggle 의 클래스가 값에 따라 바뀐다", () => {
    const { rerender } = render(
      <Toggle value onChange={() => {}} accessibilityLabel="알림" />,
    );
    expect(screen.getByRole("switch", { name: "알림" }).className).toContain(
      "bg-gray-50",
    );

    rerender(
      <Toggle value={false} onChange={() => {}} accessibilityLabel="알림" />,
    );
    expect(screen.getByRole("switch", { name: "알림" }).className).toContain(
      "bg-gray-400",
    );
  });

  it("Toggle 은 켜짐 상태를 aria-checked 로 노출한다", () => {
    const { rerender } = render(
      <Toggle value onChange={() => {}} accessibilityLabel="알림" />,
    );
    expect(screen.getByRole("switch", { name: "알림" })).toHaveAttribute(
      "aria-checked",
      "true",
    );

    rerender(
      <Toggle value={false} onChange={() => {}} accessibilityLabel="알림" />,
    );
    expect(screen.getByRole("switch", { name: "알림" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("Radio 는 선택 여부를 aria-checked 로 노출한다", () => {
    render(
      <RadioGroup value="a" onChange={() => {}}>
        <Radio value="a">
          <RadioLabel>가</RadioLabel>
        </Radio>
        <Radio value="b">
          <RadioLabel>나</RadioLabel>
        </Radio>
      </RadioGroup>,
    );

    expect(screen.getByRole("radio", { name: "가" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("radio", { name: "나" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("로딩 중인 버튼은 aria-busy 로 알린다", () => {
    render(
      <>
        <ActionButton isLoading>로딩</ActionButton>
        <ActionButton>평소</ActionButton>
      </>,
    );

    expect(screen.getByRole("button", { name: "로딩" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(screen.getByRole("button", { name: "평소" })).toHaveAttribute(
      "aria-busy",
      "false",
    );
  });

  it("Text 는 variant 의 타이포 클래스를 단다", () => {
    render(<Text variant="heading-2">제목</Text>);

    expect(screen.getByText("제목").className).toContain("text-heading-2");
  });
});
