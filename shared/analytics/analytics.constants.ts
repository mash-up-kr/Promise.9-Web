// 모든 플랫폼에 적용하는 메모리 큐·전송 정책.
export const FLUSH_INTERVAL_MS = 5000;
export const FLUSH_THRESHOLD = 100;
export const REQUEST_TIMEOUT_MS = 5000;
// 전송 지연 시 큐가 무한히 쌓이지 않도록 최대 1,000건만 보관한다.
export const QUEUE_MAX_RECORDS = 1000;
// Firehose 단일 레코드 제한: Base64 인코딩 전 최대 1,000 KiB.
export const RECORD_MAX_BYTES = 1000 * 1024;
// PutRecordBatch가 한 요청에서 허용하는 최대 레코드 수.
export const BATCH_MAX_RECORDS = 500;
// Base64 증가분과 JSON 외피를 포함해 Firehose 요청 4 MiB 한도 안에 둔다.
export const BATCH_MAX_BYTES = 3 * 1024 * 1024 - 64 * 1024;
