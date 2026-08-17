import { fireEvent, render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import { ListRow } from "./ListRow";

describe("ListRow", () => {
  test("라벨을 렌더한다", async () => {
    await render(<ListRow label="로그아웃" />);
    expect(screen.getByText("로그아웃")).toBeOnTheScreen();
  });

  test("leading·trailing 슬롯을 렌더한다", async () => {
    await render(
      <ListRow
        label="이메일"
        leading={<Text>L</Text>}
        trailing={<Text>me@x.com</Text>}
      />,
    );
    expect(screen.getByText("L")).toBeOnTheScreen();
    expect(screen.getByText("me@x.com")).toBeOnTheScreen();
  });

  test("chevron 을 주면 표식을 렌더한다", async () => {
    await render(<ListRow label="서비스 이용약관" chevron />);
    expect(screen.getByTestId("list-row-chevron")).toBeOnTheScreen();
  });

  test("chevron 이 없으면 표식을 렌더하지 않는다", async () => {
    await render(<ListRow label="버전 정보" trailing={<Text>v1.0.0</Text>} />);
    expect(screen.queryByTestId("list-row-chevron")).not.toBeOnTheScreen();
  });

  test("누르면 onPress 가 호출된다", async () => {
    const onPress = jest.fn();
    await render(<ListRow label="로그아웃" onPress={onPress} />);
    fireEvent.press(screen.getByText("로그아웃"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test("disabled 면 onPress 가 호출되지 않는다", async () => {
    const onPress = jest.fn();
    await render(<ListRow label="로그아웃" onPress={onPress} disabled />);
    fireEvent.press(screen.getByText("로그아웃"));
    expect(onPress).not.toHaveBeenCalled();
  });
});
