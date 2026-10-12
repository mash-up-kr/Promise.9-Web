import {
  QueryClient,
  QueryClientProvider,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { Text } from "react-native";

import { AsyncBoundary } from "./AsyncBoundary";

// 테스트마다 캐시를 새로 만들고, 실패를 즉시 에러로 만들기 위해 재시도를 끈다.
function renderWithQuery(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

function Deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("AsyncBoundary", () => {
  test("자식이 suspend 하는 동안 pending 을 렌더하고, 끝나면 자식을 렌더한다", async () => {
    const deferred = Deferred<string>();
    function Content() {
      const { data } = useSuspenseQuery({
        queryKey: ["ok"],
        queryFn: () => deferred.promise,
      });
      return <Text>{data}</Text>;
    }

    await renderWithQuery(
      <AsyncBoundary pending={<Text>로딩</Text>} fallback={<Text>에러</Text>}>
        <Content />
      </AsyncBoundary>,
    );
    expect(screen.getByText("로딩")).toBeOnTheScreen();

    deferred.resolve("완료");

    expect(await screen.findByText("완료")).toBeOnTheScreen();
  });

  test("자식이 던지면 fallback 을 렌더한다", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    function Content() {
      useSuspenseQuery({
        queryKey: ["fail"],
        queryFn: () => Promise.reject(new Error("boom")),
      });
      return <Text>성공</Text>;
    }

    await renderWithQuery(
      <AsyncBoundary pending={<Text>로딩</Text>} fallback={<Text>에러</Text>}>
        <Content />
      </AsyncBoundary>,
    );

    expect(await screen.findByText("에러")).toBeOnTheScreen();
    spy.mockRestore();
  });

  // 재시도가 성립하려면 ErrorBoundary 해제와 쿼리 에러 초기화가 함께 일어나야 한다.
  // 후자가 빠지면 캐시에 에러가 남아 자식이 다시 던지고 fallback 으로 되돌아온다.
  test("fallback 의 reset 을 호출하면 쿼리를 다시 실행해 성공 결과를 렌더한다", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    const queryFn = jest
      .fn<Promise<string>, []>()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce("완료");

    function Content() {
      const { data } = useSuspenseQuery({ queryKey: ["retry"], queryFn });
      return <Text>{data}</Text>;
    }

    await renderWithQuery(
      <AsyncBoundary
        pending={<Text>로딩</Text>}
        fallback={({ reset }) => <Text onPress={reset}>다시 시도</Text>}
      >
        <Content />
      </AsyncBoundary>,
    );
    expect(await screen.findByText("다시 시도")).toBeOnTheScreen();

    await fireEvent.press(screen.getByText("다시 시도"));

    expect(await screen.findByText("완료")).toBeOnTheScreen();
    expect(queryFn).toHaveBeenCalledTimes(2);
    spy.mockRestore();
  });
});
