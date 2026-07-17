import { render, screen } from "@testing-library/react-native";
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
