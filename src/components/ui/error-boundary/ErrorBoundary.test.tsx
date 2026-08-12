import { fireEvent, render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import { ErrorBoundary } from "./ErrorBoundary";

function Boom(): never {
  throw new Error("boom");
}

describe("ErrorBoundary", () => {
  test("정상 자식은 그대로 렌더한다", async () => {
    await render(
      <ErrorBoundary fallback={<Text>대체</Text>}>
        <Text>정상</Text>
      </ErrorBoundary>,
    );
    expect(screen.getByText("정상")).toBeOnTheScreen();
  });

  test("자식이 던지면 fallback 을 렌더한다", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await render(
      <ErrorBoundary fallback={<Text>대체</Text>}>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByText("대체")).toBeOnTheScreen();
    spy.mockRestore();
  });

  test("fallback 이 함수면 reset 을 넘겨 호출하고, reset 하면 자식을 다시 렌더한다", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    // 던질지 여부를 바깥에서 제어해, reset 이후엔 정상 자식이 렌더되게 한다.
    let shouldThrow = true;
    function MaybeBoom() {
      if (shouldThrow) throw new Error("boom");
      return <Text>복구</Text>;
    }

    await render(
      <ErrorBoundary
        fallback={({ reset }) => (
          <Text
            onPress={() => {
              shouldThrow = false;
              reset();
            }}
          >
            다시 시도
          </Text>
        )}
      >
        <MaybeBoom />
      </ErrorBoundary>,
    );
    expect(screen.getByText("다시 시도")).toBeOnTheScreen();

    await fireEvent.press(screen.getByText("다시 시도"));

    expect(screen.getByText("복구")).toBeOnTheScreen();
    spy.mockRestore();
  });

  test("fallback 이 함수면 던져진 에러를 그대로 넘긴다", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await render(
      <ErrorBoundary
        fallback={({ error }) => (
          <Text>
            {error instanceof Error ? error.message : "알 수 없는 에러"}
          </Text>
        )}
      >
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByText("boom")).toBeOnTheScreen();
    spy.mockRestore();
  });

  test("resetKeys 가 바뀌면 에러 상태를 해제하고 다시 렌더한다", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    const { rerender } = await render(
      <ErrorBoundary fallback={<Text>대체</Text>} resetKeys={["a"]}>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByText("대체")).toBeOnTheScreen();

    await rerender(
      <ErrorBoundary fallback={<Text>대체</Text>} resetKeys={["b"]}>
        <Text>복구</Text>
      </ErrorBoundary>,
    );
    expect(screen.getByText("복구")).toBeOnTheScreen();
    spy.mockRestore();
  });
});
