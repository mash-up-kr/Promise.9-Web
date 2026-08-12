import { render, screen, userEvent } from "@testing-library/react-native";

import { ActionButton } from "./ActionButton";

describe("ActionButton", () => {
  test("라벨을 button 으로 렌더한다", async () => {
    await render(<ActionButton label="저장" onPress={jest.fn()} />);
    expect(screen.getByRole("button", { name: "저장" })).toBeOnTheScreen();
  });

  test("누르면 onPress 가 호출된다", async () => {
    const user = userEvent.setup();
    const onPress = jest.fn();
    await render(<ActionButton label="저장" onPress={onPress} />);
    await user.press(screen.getByRole("button", { name: "저장" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test("disabled 면 onPress 가 호출되지 않는다", async () => {
    const user = userEvent.setup();
    const onPress = jest.fn();
    await render(<ActionButton label="저장" onPress={onPress} disabled />);
    await user.press(screen.getByRole("button", { name: "저장" }));
    expect(onPress).not.toHaveBeenCalled();
  });

  test("disabled 면 접근성 상태에 disabled 가 노출된다", async () => {
    await render(<ActionButton label="저장" onPress={jest.fn()} disabled />);
    expect(screen.getByRole("button", { name: "저장" })).toBeDisabled();
  });

  test("isLoading 이면 스피너가 보인다", async () => {
    await render(<ActionButton label="저장" onPress={jest.fn()} isLoading />);
    expect(screen.getByRole("progressbar")).toBeOnTheScreen();
  });

  test("isLoading 이면 onPress 가 호출되지 않는다", async () => {
    const user = userEvent.setup();
    const onPress = jest.fn();
    await render(<ActionButton label="저장" onPress={onPress} isLoading />);
    await user.press(screen.getByRole("button", { name: "저장" }));
    expect(onPress).not.toHaveBeenCalled();
  });

  test("isLoading 이면 접근성 상태에 busy 가 노출된다", async () => {
    await render(<ActionButton label="저장" onPress={jest.fn()} isLoading />);
    expect(
      screen.getByRole("button", { name: "저장" }).props.accessibilityState,
    ).toMatchObject({ busy: true });
  });

  // 로딩 중 라벨을 언마운트하면 hug 배치에서 버튼 폭이 줄어든다(§4.3.1) — 언마운트 회귀 방지.
  test("isLoading 이어도 라벨 노드는 트리에 남는다", async () => {
    await render(<ActionButton label="저장" onPress={jest.fn()} isLoading />);
    expect(screen.getByText("저장")).toBeOnTheScreen();
  });
});
