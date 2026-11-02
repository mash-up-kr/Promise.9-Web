import { FirehoseClient } from "@aws-sdk/client-firehose";
import { createFirehoseSender } from "./firehose";

jest.mock("@aws-sdk/client-firehose", () => ({
  FirehoseClient: jest.fn(),
  PutRecordBatchCommand: jest.fn().mockImplementation((input) => ({ input })),
}));
jest.mock("@aws-sdk/credential-provider-cognito-identity", () => ({
  fromCognitoIdentityPool: jest.fn(() => "credentials"),
}));
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
