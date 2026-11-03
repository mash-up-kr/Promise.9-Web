import { FirehoseClient } from "@aws-sdk/client-firehose";
import { createFirehoseSender } from "./firehose";

jest.mock("@aws-sdk/client-firehose", () => ({
  FirehoseClient: jest.fn(),
  PutRecordBatchCommand: jest.fn().mockImplementation((input) => ({ input })),
}));
jest.mock("@aws-sdk/credential-provider-cognito-identity", () => ({
  fromCognitoIdentityPool: jest.fn(() => "credentials"),
}));

describe("호출부에서 지정한 keepalive 정책", () => {
  test.each([
    [new Uint8Array(65536), true],
    [new Uint8Array(65537), false],
    ["a".repeat(65536), true],
    ["a".repeat(65537), false],
    ["가".repeat(22000), false],
  ])("최종 본문의 바이트 크기로 keepalive를 제한한다", (body, expected) => {
    createFirehoseSender({
      region: "region",
      identityPoolId: "pool",
      streamName: "stream",
      keepalive: true,
    });
    const handler = jest
      .mocked(FirehoseClient)
      .mock.calls.at(-1)?.[0]?.requestHandler;
    if (
      !handler ||
      !("requestInit" in handler) ||
      typeof handler.requestInit !== "function"
    )
      throw new Error("keepalive handler missing");
    expect(handler.requestInit({ body })).toEqual({ keepalive: expected });
  });
  test.each([
    undefined,
    false,
  ])("keepalive=%s이면 SDK 기본 핸들러를 유지한다", (keepalive) => {
    createFirehoseSender({
      region: "region",
      identityPoolId: "pool",
      streamName: "stream",
      keepalive,
    });
    expect(
      jest.mocked(FirehoseClient).mock.calls.at(-1)?.[0],
    ).not.toHaveProperty("requestHandler");
  });
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
