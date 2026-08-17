import { render, screen, userEvent } from "@testing-library/react-native";
import { Text } from "react-native";

import { ErrorBoundary } from "@/components/ui/error-boundary/ErrorBoundary";

import { ActionButton, actionButtonStyles } from "./ActionButton";

describe("ActionButton (스킨)", () => {
  test("문자열 children 을 button 으로 렌더한다", async () => {
    await render(<ActionButton onPress={jest.fn()}>저장</ActionButton>);
    expect(screen.getByRole("button", { name: "저장" })).toBeOnTheScreen();
  });

  test("누르면 onPress 가 호출된다", async () => {
    const user = userEvent.setup();
    const onPress = jest.fn();
    await render(<ActionButton onPress={onPress}>저장</ActionButton>);
    await user.press(screen.getByRole("button", { name: "저장" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test("disabled 면 onPress 가 호출되지 않고 disabled 가 노출된다", async () => {
    const user = userEvent.setup();
    const onPress = jest.fn();
    await render(
      <ActionButton onPress={onPress} disabled>
        저장
      </ActionButton>,
    );
    const button = screen.getByRole("button", { name: "저장" });
    await user.press(button);
    expect(onPress).not.toHaveBeenCalled();
    expect(button).toBeDisabled();
  });

  test("isLoading 이면 스피너가 보인다", async () => {
    await render(
      <ActionButton onPress={jest.fn()} isLoading>
        저장
      </ActionButton>,
    );
    expect(screen.getByRole("progressbar")).toBeOnTheScreen();
  });

  test("isLoading 이면 onPress 가 호출되지 않는다", async () => {
    const user = userEvent.setup();
    const onPress = jest.fn();
    await render(
      <ActionButton onPress={onPress} isLoading>
        저장
      </ActionButton>,
    );
    await user.press(screen.getByRole("button", { name: "저장" }));
    expect(onPress).not.toHaveBeenCalled();
  });

  test("isLoading 이면 접근성 상태에 busy 가 노출된다", async () => {
    await render(
      <ActionButton onPress={jest.fn()} isLoading>
        저장
      </ActionButton>,
    );
    expect(
      screen.getByRole("button", { name: "저장" }).props.accessibilityState,
    ).toMatchObject({ busy: true });
  });

  // 로딩 중 라벨을 언마운트하면 hug 배치에서 버튼 폭이 줄어든다 — 언마운트 회귀 방지.
  test("isLoading 이어도 라벨 노드는 트리에 남는다", async () => {
    await render(
      <ActionButton onPress={jest.fn()} isLoading>
        저장
      </ActionButton>,
    );
    expect(screen.getByText("저장")).toBeOnTheScreen();
  });

  test("숫자 children 도 텍스트로 렌더한다", async () => {
    await render(<ActionButton onPress={jest.fn()}>{3}</ActionButton>);
    expect(screen.getByText("3")).toBeOnTheScreen();
  });

  test("문자열과 표현식이 섞인 children 을 하나의 텍스트로 렌더한다", async () => {
    await render(<ActionButton onPress={jest.fn()}>저장 {2}개</ActionButton>);
    expect(screen.getByText("저장 2개")).toBeOnTheScreen();
  });

  test("ActionButton.Text 로 조립한 라벨도 button 으로 렌더한다", async () => {
    await render(
      <ActionButton onPress={jest.fn()} accessibilityLabel="저장">
        <ActionButton.Text>저장</ActionButton.Text>
      </ActionButton>,
    );
    expect(screen.getByRole("button", { name: "저장" })).toBeOnTheScreen();
  });

  test("ActionButton.Text 를 <ActionButton> 밖에서 쓰면 던진다", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await render(
      <ErrorBoundary fallback={<Text>가드</Text>}>
        <ActionButton.Text>저장</ActionButton.Text>
      </ErrorBoundary>,
    );
    expect(screen.getByText("가드")).toBeOnTheScreen();
    spy.mockRestore();
  });

  test("isLoading + 조립에서도 라벨 노드는 트리에 남는다", async () => {
    await render(
      <ActionButton onPress={jest.fn()} accessibilityLabel="저장" isLoading>
        <ActionButton.Text>저장</ActionButton.Text>
      </ActionButton>,
    );
    expect(screen.getByText("저장")).toBeOnTheScreen();
  });
});

// jest 는 className 을 해석하지 않으므로 tv 매핑을 직접 단언한다(expo-pitfalls).
// 배경은 pressed·disabled 조합으로 갈리므로(compoundVariants) 평상시 상태를 명시해 뽑는다.
describe("actionButtonStyles", () => {
  const resting = { isActive: false, isDisabled: false } as const;

  test("medium 은 시안 Action Button Medium(높이 48·pill)이다", () => {
    const cls = actionButtonStyles({ variant: "primary", ...resting });
    expect(cls).toContain("h-12");
    expect(cls).toContain("rounded-full");
  });

  test("primary 는 흰 배경이다", () => {
    expect(actionButtonStyles({ variant: "primary", ...resting })).toContain(
      "bg-opacity-white-100",
    );
  });

  test("assistive 는 gray-600 배경이다", () => {
    expect(actionButtonStyles({ variant: "assistive", ...resting })).toContain(
      "bg-gray-600",
    );
  });

  test("destructive 는 action-destructive 토큰 배경이다", () => {
    const cls = actionButtonStyles({ variant: "destructive", ...resting });
    expect(cls).toContain("bg-action-destructive-background");
    expect(cls).not.toContain("rgba");
  });

  test("disabled 는 variant 와 무관하게 죽은 회색이다", () => {
    expect(
      actionButtonStyles({
        variant: "primary",
        isActive: false,
        isDisabled: true,
      }),
    ).toContain("bg-gray-200");
    expect(
      actionButtonStyles({
        variant: "assistive",
        isActive: false,
        isDisabled: true,
      }),
    ).toContain("bg-gray-400");
  });
});
