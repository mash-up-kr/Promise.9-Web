import { render, screen, userEvent } from "@testing-library/react-native";
import { Text } from "react-native";

import { ErrorBoundary } from "@/components/ui/error-boundary/ErrorBoundary";

import { ActionButton } from "./ActionButton";

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
