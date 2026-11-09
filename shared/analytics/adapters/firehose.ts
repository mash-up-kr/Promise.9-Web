import {
  FirehoseClient,
  PutRecordBatchCommand,
} from "@aws-sdk/client-firehose";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";
import { fromUtf8 } from "@smithy/util-utf8";

const KEEPALIVE_MAX_BYTES = 64 * 1024;

/** 공개 AWS 식별자만 받는다. 고정 access key·secret을 클라이언트에 넣지 않는다. */
export interface AnalyticsAwsConfig {
  region: string;
  identityPoolId: string;
  streamName: string;
  /** 호출 표면에서 지원을 확인한 경우에만 활성화한다. 기본값은 SDK 기본 핸들러다. */
  keepalive?: boolean;
}
/**
 * Cognito 임시 자격 증명으로 Firehose에 배치를 전송한다.
 * 성공 응답의 부분 실패는 허용한다. 개별 레코드 결과를 검사하지 않는다.
 * 요청 자체가 실패하거나 레코드가 모두 실패하면 예외를 전달해 코어가 배치 전체를 재시도하게 한다.
 */
export function createFirehoseSender(
  config: AnalyticsAwsConfig,
): (records: Uint8Array[], signal: AbortSignal) => Promise<void> {
  const client = new FirehoseClient({
    region: config.region,
    ...(config.keepalive
      ? {
          requestHandler: {
            // Base64·JSON 외피를 포함한 최종 본문이 64KiB 이내일 때만 종료 후 전송을 유지한다.
            requestInit: ({ body }) => {
              let bodyByteLength = Number.POSITIVE_INFINITY;
              if (body instanceof Uint8Array) bodyByteLength = body.byteLength;
              else if (typeof body === "string")
                bodyByteLength = fromUtf8(body).byteLength;
              return { keepalive: bodyByteLength <= KEEPALIVE_MAX_BYTES };
            },
          },
        }
      : {}),
    credentials: fromCognitoIdentityPool({
      identityPoolId: config.identityPoolId,
      clientConfig: { region: config.region },
    }),
  });
  return async (records, signal) => {
    const { FailedPutCount } = await client.send(
      new PutRecordBatchCommand({
        DeliveryStreamName: config.streamName,
        Records: records.map((Data) => ({ Data })),
      }),
      { abortSignal: signal },
    );
    if (FailedPutCount && FailedPutCount === records.length)
      throw new Error("all_records_failed");
  };
}
