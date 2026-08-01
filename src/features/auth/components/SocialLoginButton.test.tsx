import { fireEvent, render, screen } from "@testing-library/react-native";

import { SocialLoginButton } from "./SocialLoginButton";

describe("SocialLoginButton", () => {
  test("라벨을 표시하고 탭하면 provider 와 함께 onPress 를 호출한다", async () => {
    const onPress = jest.fn();
    await render(
      <SocialLoginButton
        provider="google"
        label="구글로 로그인"
        onPress={onPress}
      />,
    );

    await fireEvent.press(
      screen.getByRole("button", { name: "구글로 로그인" }),
    );

    expect(onPress).toHaveBeenCalledWith("google");
  });

  test("disabled 면 탭해도 onPress 가 호출되지 않는다", async () => {
    const onPress = jest.fn();
    await render(
      <SocialLoginButton
        provider="google"
        label="구글로 로그인"
        onPress={onPress}
        disabled
      />,
    );

    await fireEvent.press(
      screen.getByRole("button", { name: "구글로 로그인" }),
    );

    expect(onPress).not.toHaveBeenCalled();
  });
});
