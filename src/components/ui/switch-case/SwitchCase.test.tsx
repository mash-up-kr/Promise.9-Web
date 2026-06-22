import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import { SwitchCase } from "./SwitchCase";

describe("SwitchCase", () => {
  test("value 와 일치하는 caseBy 컴포넌트를 렌더한다", async () => {
    await render(
      <SwitchCase
        value="success"
        caseBy={{
          loading: () => <Text>로딩</Text>,
          success: () => <Text>성공</Text>,
        }}
      />,
    );
    expect(screen.getByText("성공")).toBeOnTheScreen();
    expect(screen.queryByText("로딩")).not.toBeOnTheScreen();
  });

  test("boolean value 는 'true'/'false' 키로 매칭된다", async () => {
    await render(
      <SwitchCase
        value={false}
        caseBy={{
          true: () => <Text>참</Text>,
          false: () => <Text>거짓</Text>,
        }}
      />,
    );
    expect(screen.getByText("거짓")).toBeOnTheScreen();
  });

  test("number value 는 문자열 키로 매칭된다", async () => {
    await render(
      <SwitchCase
        value={2}
        caseBy={{
          1: () => <Text>하나</Text>,
          2: () => <Text>둘</Text>,
        }}
      />,
    );
    expect(screen.getByText("둘")).toBeOnTheScreen();
  });

  test("일치하는 키가 없으면 defaultComponent 를 렌더한다", async () => {
    await render(
      <SwitchCase
        value="unknown"
        caseBy={{ known: () => <Text>알려짐</Text> }}
        defaultComponent={() => <Text>기본</Text>}
      />,
    );
    expect(screen.getByText("기본")).toBeOnTheScreen();
  });

  test("일치하는 키도 defaultComponent 도 없으면 아무것도 렌더하지 않는다", async () => {
    await render(
      <SwitchCase value="x" caseBy={{ y: () => <Text>와이</Text> }} />,
    );
    expect(screen.queryByText("와이")).not.toBeOnTheScreen();
  });
});
