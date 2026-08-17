import { fireEvent, render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import { ListSection } from "./ListSection";

describe("ListSection", () => {
  test("타이틀과 자식을 렌더한다", async () => {
    await render(
      <ListSection title="계정">
        <Text>이메일</Text>
      </ListSection>,
    );
    expect(screen.getByText("계정")).toBeOnTheScreen();
    expect(screen.getByText("이메일")).toBeOnTheScreen();
  });

  test("action 을 주면 렌더하고 누르면 콜백이 호출된다", async () => {
    const onPress = jest.fn();
    await render(
      <ListSection title="내 폴더" action={{ label: "폴더 추가", onPress }}>
        <Text>디자인</Text>
      </ListSection>,
    );
    fireEvent.press(screen.getByLabelText("폴더 추가"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test("action 이 없으면 액션 버튼을 렌더하지 않는다", async () => {
    await render(
      <ListSection title="서비스">
        <Text>버전 정보</Text>
      </ListSection>,
    );
    expect(screen.queryByLabelText("폴더 추가")).not.toBeOnTheScreen();
  });
});
