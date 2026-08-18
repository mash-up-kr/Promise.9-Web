import { act, fireEvent, render, screen } from "@testing-library/react-native";

import { SocialLoginButton } from "./SocialLoginButton";

describe("SocialLoginButton", () => {
  test("라벨을 표시하고 탭하면 provider 와 함께 onPress 를 호출한다", async () => {
    const onPress = jest.fn();
    await render(
      <SocialLoginButton
        provider="google"
        label="Google로 계속하기"
        onPress={onPress}
      />,
    );

    await fireEvent.press(
      screen.getByRole("button", { name: "Google로 계속하기" }),
    );

    expect(onPress).toHaveBeenCalledWith("google");
  });

  test("provider 브랜드 아이콘을 렌더한다", async () => {
    await render(
      <SocialLoginButton
        provider="kakao"
        label="카카오로 계속하기"
        onPress={jest.fn()}
      />,
    );
    expect(screen.getByTestId("kakao-glyph")).toBeTruthy();
  });

  test("disabled 면 탭해도 onPress 가 호출되지 않는다", async () => {
    const onPress = jest.fn();
    await render(
      <SocialLoginButton
        provider="google"
        label="Google로 계속하기"
        onPress={onPress}
        disabled
      />,
    );

    await fireEvent.press(
      screen.getByRole("button", { name: "Google로 계속하기" }),
    );

    expect(onPress).not.toHaveBeenCalled();
  });

  test("loading 이면 즉시 비활성화되지만, 스피너는 200ms 뒤에 나타난다", async () => {
    jest.useFakeTimers();
    const onPress = jest.fn();
    await render(
      <SocialLoginButton
        provider="kakao"
        label="카카오로 계속하기"
        onPress={onPress}
        loading
      />,
    );

    // 짧은 응답에서 깜빡이지 않도록 스피너는 바로 뜨지 않는다(Figma Spinner 주석).
    expect(screen.queryByRole("progressbar")).toBeNull();
    // 하지만 탭은 즉시 막혀야 한다(중복 요청 방지).
    await fireEvent.press(screen.getByRole("button"));
    expect(onPress).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(200);
    });

    // 200ms 를 넘기면 라벨 대신 스피너(progressbar)가 뜬다.
    expect(screen.queryByText("카카오로 계속하기")).toBeNull();
    expect(screen.getByRole("progressbar")).toBeTruthy();

    jest.useRealTimers();
  });

  test("200ms 미만에 로딩이 끝나면 스피너가 뜨지 않는다", async () => {
    jest.useFakeTimers();
    const { rerender } = await render(
      <SocialLoginButton
        provider="kakao"
        label="카카오로 계속하기"
        onPress={jest.fn()}
        loading
      />,
    );

    await act(async () => {
      jest.advanceTimersByTime(150);
    });
    await rerender(
      <SocialLoginButton
        provider="kakao"
        label="카카오로 계속하기"
        onPress={jest.fn()}
        loading={false}
      />,
    );
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(screen.getByText("카카오로 계속하기")).toBeTruthy();

    jest.useRealTimers();
  });
});
