import { render, screen, userEvent } from "@testing-library/react-native";
import { Text } from "react-native";

import { ErrorBoundary } from "@/components/ui/error-boundary/ErrorBoundary";

import { Button, type ButtonState, useButtonState } from "./Button";

describe("Button (헤드리스 코어)", () => {
  test("자식을 button 으로 렌더한다", async () => {
    await render(
      <Button onPress={jest.fn()}>
        <Text>저장</Text>
      </Button>,
    );
    expect(screen.getByRole("button", { name: "저장" })).toBeOnTheScreen();
  });

  test("누르면 onPress 가 호출된다", async () => {
    const user = userEvent.setup();
    const onPress = jest.fn();
    await render(
      <Button onPress={onPress}>
        <Text>저장</Text>
      </Button>,
    );
    await user.press(screen.getByRole("button", { name: "저장" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test("disabled 면 press 가 막히고 접근성 상태에 disabled 가 노출된다", async () => {
    const user = userEvent.setup();
    const onPress = jest.fn();
    await render(
      <Button onPress={onPress} disabled>
        <Text>저장</Text>
      </Button>,
    );
    const button = screen.getByRole("button", { name: "저장" });
    await user.press(button);
    expect(onPress).not.toHaveBeenCalled();
    expect(button).toBeDisabled();
  });

  test("isLoading 이면 press 가 막히고 busy 가 노출된다", async () => {
    const user = userEvent.setup();
    const onPress = jest.fn();
    await render(
      <Button onPress={onPress} isLoading>
        <Text>저장</Text>
      </Button>,
    );
    const button = screen.getByRole("button", { name: "저장" });
    await user.press(button);
    expect(onPress).not.toHaveBeenCalled();
    expect(button.props.accessibilityState).toMatchObject({ busy: true });
  });

  test("className 리졸버에 현재 상태를 넘긴다(스킨이 상태로 스타일 계산)", async () => {
    const resolver = jest.fn((_state: ButtonState) => "resolved");
    await render(
      <Button className={resolver} isLoading>
        <Text>저장</Text>
      </Button>,
    );
    expect(resolver).toHaveBeenCalledWith(
      expect.objectContaining({ isLoading: true, disabled: false }),
    );
  });

  test("useButtonState 를 <Button> 밖에서 쓰면 던진다", async () => {
    function Consumer() {
      useButtonState();
      return null;
    }
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await render(
      <ErrorBoundary fallback={<Text>가드</Text>}>
        <Consumer />
      </ErrorBoundary>,
    );
    expect(screen.getByText("가드")).toBeOnTheScreen();
    spy.mockRestore();
  });
});
