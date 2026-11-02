import {
  FirehoseClient,
  PutRecordBatchCommand,
} from "@aws-sdk/client-firehose";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";

/** 공개 AWS 식별자만 받는다. 고정 access key·secret을 클라이언트에 넣지 않는다. */
export interface AnalyticsAwsConfig {
  region: string;
  identityPoolId: string;
  streamName: string;
}
/**
 * Cognito 임시 자격 증명으로 Firehose에 배치를 전송한다.
 * 성공 응답의 부분 실패는 허용한다. 개별 레코드 결과를 검사하지 않는다.
 * 요청 자체가 실패하면 예외를 전달해 코어가 배치 전체를 재시도하게 한다.
 */
export function createFirehoseSender(
  config: AnalyticsAwsConfig,
): (records: Uint8Array[], signal: AbortSignal) => Promise<void> {
  const client = new FirehoseClient({
    region: config.region,
    credentials: fromCognitoIdentityPool({
      identityPoolId: config.identityPoolId,
      clientConfig: { region: config.region },
    }),
  });
  return async (records, signal) => {
    await client.send(
      new PutRecordBatchCommand({
        DeliveryStreamName: config.streamName,
        Records: records.map((Data) => ({ Data })),
      }),
      { abortSignal: signal },
    );
  };
}
