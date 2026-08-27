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

  // 시트처럼 이미 가로 여백을 가진 컨테이너 안에서는 여백이 이중으로 들어간다.
  test("기본은 보관함 화면 가로 여백(px-5)을 가진다", async () => {
    const { toJSON } = await render(
      <ListSection title="기본 폴더">
        <Text>전체</Text>
      </ListSection>,
    );
    expect(toJSON()?.props.className).toContain("px-5");
  });

  test("inset 을 끄면 가로 여백을 넣지 않는다", async () => {
    const { toJSON } = await render(
      <ListSection title="기본 폴더" inset={false}>
        <Text>전체</Text>
      </ListSection>,
    );
    expect(toJSON()?.props.className).not.toContain("px-5");
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
