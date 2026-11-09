import { fromUtf8 } from "@smithy/util-utf8";
import {
  BATCH_MAX_BYTES,
  FLUSH_INTERVAL_MS,
  FLUSH_THRESHOLD,
  RECORD_MAX_BYTES,
  REQUEST_TIMEOUT_MS,
} from "./analytics.constants";
import { AnalyticsQueue } from "./analytics.queue";
import {
  type AnalyticsContext,
  type AnalyticsEventInput,
  type AnalyticsUtm,
  createAnalyticsEvent,
} from "./analytics.schema";

export interface TrackDeliveryOptions {
  /** 즉시 전송 옵션. 5초 주기나 100건을 기다리지 않고 큐 전송을 요청한다. */
  flushSoon?: boolean;
}

export interface ClientOptions {
  source: AnalyticsContext["source"];
  environment: AnalyticsContext["environment"];
  newId: () => string;
  /** UTF-8 바이트로 변환한 이벤트 묶음을 보낸다. Promise가 reject되면 해당 이벤트를 큐에 남긴다. */
  send: (records: Uint8Array[], signal: AbortSignal) => Promise<void>;
  os?: string;
  browser?: string | null;
  clientVersion?: string | null;
}

/**
 * 기록 시점의 공통 필드를 채우고, 메모리 큐에 모아 묶음 전송한다.
 * 생성 직후부터 이벤트를 받으며, initialize()로 식별자를 전달받은 뒤 전송한다.
 */
export class AnalyticsClient {
  private isReady = false;
  private readonly queue = new AnalyticsQueue();
  private readonly context: AnalyticsContext;
  private flushTimer?: ReturnType<typeof setTimeout>;
  private flushPromise?: Promise<void>;
  private requestAbortController?: AbortController;
  private isClientDisposed = false;
  private isClientActive = true;

  get isActive(): boolean {
    return this.isClientActive;
  }

  get isDisposed(): boolean {
    return this.isClientDisposed;
  }

  constructor(private readonly options: ClientOptions) {
    this.context = {
      source: options.source,
      environment: options.environment,
      anonymous_id: null,
      user_id: null,
      session_id: null,
      utm: null,
      os: options.os ?? "unknown",
      browser: this.resolveBrowser(options),
      client_version: options.clientVersion ?? null,
    };
  }

  private resolveBrowser(options: ClientOptions): string | null {
    if (options.browser !== undefined) return options.browser;
    return options.source === "app" ? null : "unknown";
  }

  /**
   * 익명 ID와 세션 ID를 적용하고 전송을 시작할 수 있게 한다.
   * 먼저 수집한 이벤트에는 비어 있는 두 ID만 채우고, 기록 당시의 시각·사용자·UTM은 유지한다.
   */
  initialize(anonymousId: string, sessionId: string): void {
    this.context.anonymous_id = anonymousId;
    this.context.session_id = sessionId;
    this.queue.fillMissingIdentity(anonymousId, sessionId);
    this.isReady = true;
    this.schedule();
  }

  /** 이벤트를 메모리 큐에 넣으면 true, 넣지 못하면 false를 반환한다. true는 전송 성공을 뜻하지 않는다. */
  trackEvent(
    input: AnalyticsEventInput,
    options?: TrackDeliveryOptions,
  ): boolean {
    if (this.isDisposed) return false;
    try {
      const event = createAnalyticsEvent(input, this.context, {
        eventId: this.options.newId(),
        occurredAt: new Date().toISOString(),
      });
      if (!this.queue.enqueue(event)) {
        console.warn("[analytics] queue_full");
        return false;
      }
      // 실패한 큐가 임계값 이상이어도 새 이벤트마다 전송을 반복하지 않는다.
      if (this.queue.size === FLUSH_THRESHOLD || options?.flushSoon)
        void this.flush();
      else this.schedule();
      return true;
    } catch {
      console.warn("[analytics] invalid_event");
      return false;
    }
  }

  /** 이후 이벤트에 사용할 식별자를 적용한다. 이미 큐에 들어간 이벤트는 바꾸지 않는다. */
  setIdentity(userId: string | null, anonymousId?: string): void {
    this.context.user_id = userId;
    if (anonymousId !== undefined) this.context.anonymous_id = anonymousId;
  }

  setUtm(utm: AnalyticsUtm | null): void {
    this.context.utm = utm;
  }

  /**
   * false이면 주기 전송을 멈추고 남은 이벤트를 한 번 더 보내려고 한다.
   * true로 돌아오면 남은 이벤트를 보내고 주기 전송을 재개한다.
   */
  setActive(isActive: boolean): void {
    if (this.isDisposed) return;
    const hasActivityChanged = this.isClientActive !== isActive;
    this.isClientActive = isActive;
    if (!isActive) {
      clearTimeout(this.flushTimer);
      this.flushTimer = undefined;
    }
    if (!isActive || hasActivityChanged) void this.flush();
  }

  /**
   * 큐에 남은 이벤트를 바로 전송한다. 페이지 이탈·앱 백그라운드 전환 시에도 사용한다.
   * 초기화 전에는 보내지 않으며, 이미 전송 중이면 같은 Promise를 반환한다.
   */
  flush(): Promise<void> {
    if (this.flushPromise) return this.flushPromise;
    if (this.isDisposed || !this.isReady || !this.queue.size)
      return Promise.resolve();
    clearTimeout(this.flushTimer);
    this.flushTimer = undefined;
    this.flushPromise = this.sendQueuedEvents().finally(() => {
      this.flushPromise = undefined;
      this.schedule();
    });
    return this.flushPromise;
  }

  private async sendQueuedEvents(): Promise<void> {
    while (this.queue.size && !this.isDisposed) {
      try {
        const records: Uint8Array[] = [];
        let processedEventCount = 0;
        let batchByteLength = 0;
        for (const event of this.queue.peekBatch()) {
          // Firehose에 넘길 바이트로 변환한다. 줄바꿈은 S3에서 이벤트를 한 줄씩 구분하기 위해 붙인다.
          const data = fromUtf8(`${JSON.stringify(event)}\n`);
          if (data.byteLength > RECORD_MAX_BYTES) {
            // 전송 불가능한 한 건이 뒤의 정상 이벤트까지 막지 않도록 제외한다.
            console.warn("[analytics] event_too_large");
            processedEventCount++;
            continue;
          }
          if (batchByteLength + data.byteLength > BATCH_MAX_BYTES) break;
          records.push(data);
          batchByteLength += data.byteLength;
          processedEventCount++;
        }
        if (records.length) await this.send(records);
        this.queue.acknowledge(processedEventCount);
      } catch {
        // 실패한 배치는 큐에 남겨 다음 주기 전송이나 flush() 호출에서 다시 보낸다.
        console.warn("[analytics] batch_retry");
        return;
      }
    }
  }

  private async send(records: Uint8Array[]): Promise<void> {
    const controller = new AbortController();
    this.requestAbortController = controller;
    let rejectAbort: () => void = () => {};
    // 전송 함수가 중단 신호에 반응하지 않아도 시간 초과·dispose() 시 전송 대기를 끝낸다.
    const aborted = new Promise<never>((_, reject) => {
      rejectAbort = () => reject(new Error("request_aborted"));
      controller.signal.addEventListener("abort", rejectAbort, { once: true });
    });
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      return await Promise.race([
        this.options.send(records, controller.signal),
        aborted,
      ]);
    } finally {
      clearTimeout(timeout);
      controller.signal.removeEventListener("abort", rejectAbort);
      this.requestAbortController = undefined;
    }
  }

  private schedule(): void {
    if (
      this.isDisposed ||
      !this.isReady ||
      !this.isActive ||
      this.flushTimer ||
      this.flushPromise ||
      !this.queue.size
    )
      return;
    this.flushTimer = setTimeout(() => {
      this.flushTimer = undefined;
      void this.flush();
    }, FLUSH_INTERVAL_MS);
  }

  /**
   * 새 이벤트 수집을 막고 전송 타이머와 진행 중인 요청을 중단한다.
   * 남은 이벤트를 보내려면 dispose() 전에 await flush()를 호출한다.
   */
  dispose(): void {
    this.isClientDisposed = true;
    clearTimeout(this.flushTimer);
    this.requestAbortController?.abort();
  }
}
