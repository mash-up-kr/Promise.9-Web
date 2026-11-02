import { FirehoseClient } from "@aws-sdk/client-firehose";
import { createFirehoseSender } from "./firehose";

jest.mock("@aws-sdk/client-firehose", () => ({
  FirehoseClient: jest.fn(),
  PutRecordBatchCommand: jest.fn().mockImplementation((input) => ({ input })),
}));
jest.mock("@aws-sdk/credential-provider-cognito-identity", () => ({
  fromCognitoIdentityPool: jest.fn(() => "credentials"),
}));

describe("브라우저 종료 전 전송", () => {
  const originalRequest = Object.getOwnPropertyDescriptor(
    globalThis,
    "Request",
  );

  afterEach(() => {
    if (originalRequest) {
      Object.defineProperty(globalThis, "Request", originalRequest);
    } else {
      Reflect.deleteProperty(globalThis, "Request");
    }
  });

  test.each([
    ["SDK 바이트 본문 64KiB 경계", new Uint8Array(65536), true],
    ["SDK 바이트 본문 64KiB 초과", new Uint8Array(65537), false],
    ["64KiB 경계", "a".repeat(65536), true],
    ["64KiB 초과", "a".repeat(65537), false],
    ["문자 수는 작아도 UTF-8 바이트가 초과", "가".repeat(22000), false],
  ])("%s인 최종 요청 본문에 keepalive를 선택한다", (_name, body, expected) => {
    Object.defineProperty(globalThis, "Request", {
      configurable: true,
      value: class {
        get keepalive() {
          return false;
        }
      },
    });
    const requestInit = getRequestInit();
    expect(requestInit({ body })).toEqual({
      keepalive: expected,
    });
  });

  test("keepalive를 지원하지 않는 앱에서는 일반 요청을 유지한다", () => {
    Object.defineProperty(globalThis, "Request", {
      configurable: true,
      value: class {},
    });
    const requestInit = getRequestInit();
    expect(requestInit({ body: "{}" })).toEqual({ keepalive: false });
  });

  function getRequestInit() {
    createFirehoseSender({
      region: "ap-northeast-2",
      identityPoolId: "pool",
      streamName: "stream",
    });
    const config = jest.mocked(FirehoseClient).mock.calls.at(-1)?.[0];
    const handler = config?.requestHandler;
    if (
      !handler ||
      !("requestInit" in handler) ||
      typeof handler.requestInit !== "function"
    ) {
      throw new Error("Firehose 요청에 keepalive 선택 로직이 없습니다.");
    }
    return handler.requestInit;
  }
});

test("AWS 성공 응답의 부분 실패·응답 누락은 무시한다", async () => {
  const send = jest.fn().mockResolvedValue({
    RequestResponses: [
      { RecordId: "ok" },
      { ErrorCode: "ServiceUnavailableException" },
    ],
  });
  jest
    .mocked(FirehoseClient)
    .mockImplementation(() => ({ send }) as unknown as FirehoseClient);
  const transport = createFirehoseSender({
    region: "ap-northeast-2",
    identityPoolId: "pool",
    streamName: "stream",
  });
  const signal = new AbortController().signal;
  expect(
    await transport(
      [new Uint8Array([1]), new Uint8Array([2]), new Uint8Array([3])],
      signal,
    ),
  ).toBeUndefined();
  expect(send).toHaveBeenCalledWith(
    expect.objectContaining({
      input: {
        DeliveryStreamName: "stream",
        Records: [
          { Data: new Uint8Array([1]) },
          { Data: new Uint8Array([2]) },
          { Data: new Uint8Array([3]) },
        ],
      },
    }),
    { abortSignal: signal },
  );
});

test("요청 전체 실패는 호출자에게 전달한다", async () => {
  const error = new Error("network unavailable");
  const send = jest.fn().mockRejectedValue(error);
  jest
    .mocked(FirehoseClient)
    .mockImplementation(() => ({ send }) as unknown as FirehoseClient);
  const transport = createFirehoseSender({
    region: "ap-northeast-2",
    identityPoolId: "pool",
    streamName: "stream",
  });
  await expect(
    transport([new Uint8Array([1])], new AbortController().signal),
  ).rejects.toBe(error);
});
