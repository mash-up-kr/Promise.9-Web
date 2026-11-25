import type { AnalyticsAwsConfig } from "@shared/analytics/adapters/firehose";
import { captureUtm } from "@shared/analytics/identity/utm";
import {
  type MarketingTouch,
  marketingTouchSchema,
} from "@shared/entities/user/user.attribution.contracts";
import { AnalyticsClient } from "./analytics.client";
import type { AnalyticsContext, AnalyticsUtm } from "./analytics.schema";

/** 식별자·미동기화 UTM만 보관한다. 이벤트 큐는 이 저장소에 쓰지 않는다. */
export interface AnalyticsStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}
export interface AnalyticsRuntime {
  client: AnalyticsClient;
  /** 최초 접근 시 복구를 시작한다. 이벤트 수집은 기다리지 않아도 되지만 전송은 준비 후 시작한다. */
  ready: Promise<void>;
  /** 회원 전환을 기록한다. 회원 ID는 이벤트에 넣지 않고, 로그아웃·계정 전환 시 익명 ID와 유입 정보를 초기화한다. */
  identify(userId: string | null): void;
  setUtm(utm: AnalyticsUtm | null): void;
  /** 수집 끄기 설정을 적용하고 기기에 저장한다. 다음 실행에서는 첫 이벤트 전송 전에 복구한다. */
  setCollecting(isCollecting: boolean): void;
  subscribeCollecting: (listener: () => void) => () => void;
  capture: (values: Record<string, unknown>) => void;
  readonly pendingTouch: MarketingTouch | null;
  acknowledgeTouch: (touchId: string) => void;
  subscribeTouch: (listener: () => void) => () => void;
}
export interface RuntimeOptions {
  source: AnalyticsContext["source"];
  environment: AnalyticsContext["environment"];
  aws: AnalyticsAwsConfig;
  storage: AnalyticsStorage;
  newId: () => string;
  send?: (records: Uint8Array[], signal: AbortSignal) => Promise<void>;
  os?: string;
  browser?: string | null;
  clientVersion?: string | null;
}
const ID_KEY = "promise9_analytics_anonymous_id";
const UTM_KEY = "promise9_analytics_attribution";
const USER_KEY = "promise9_analytics_user_id";
export const ANALYTICS_COLLECTING_KEY = "promise9_analytics_collecting";

/** 화면은 즉시 이 런타임을 사용한다. SDK와 저장소 준비는 렌더를 막지 않는다. */
export function createAnalytics(options: RuntimeOptions): AnalyticsRuntime {
  const readStorage = async (key: string) => {
    try {
      return await options.storage.get(key);
    } catch {
      console.warn("[analytics] storage_read_failed");
      return null;
    }
  };
  // 이전 비동기 쓰기가 늦게 끝나 최신 식별자·UTM을 덮어쓰지 않도록 직렬화한다.
  let pendingWrites = Promise.resolve();
  const writeStorage = (key: string, value: string) => {
    pendingWrites = pendingWrites
      .then(() => options.storage.set(key, value))
      .catch(() => console.warn("[analytics] storage_write_failed"));
  };
  let lastCampaignKey = "";
  let pendingTouch: MarketingTouch | null = null;
  let identifiedUserId: string | null = null;
  let hasCollectingChanged = false;
  const touchListeners = new Set<() => void>();
  const collectingListeners = new Set<() => void>();
  let firehoseSender:
    | ReturnType<
        typeof import("@shared/analytics/adapters/firehose").createFirehoseSender
      >
    | undefined;
  const client = new AnalyticsClient({
    ...options,
    send:
      options.send ??
      (async (records, signal) => {
        firehoseSender ??= (
          await import("@shared/analytics/adapters/firehose")
        ).createFirehoseSender(options.aws);
        return firehoseSender(records, signal);
      }),
  });
  const setUtm: AnalyticsRuntime["setUtm"] = (utm) => client.setUtm(utm);
  // 수집을 끄면 유입 접점도 기기에 남기거나 계정에 동기화하지 않는다(처리방침 제9조).
  const dropTouch = () => {
    pendingTouch = null;
    lastCampaignKey = "";
    client.setUtm(null);
    writeStorage(UTM_KEY, "null");
  };
  let readyPromise: Promise<void> | undefined;
  const restoreFromStorage = () =>
    (readyPromise ??= (async () => {
      const [
        storedAnonymousId,
        storedTouchJson,
        storedUserId,
        storedCollecting,
      ] = await Promise.all([
        readStorage(ID_KEY),
        readStorage(UTM_KEY),
        readStorage(USER_KEY),
        // 끄기 설정을 읽지 못하면 그 실행에서는 끈 것으로 본다.
        options.storage.get(ANALYTICS_COLLECTING_KEY).catch(() => {
          console.warn("[analytics] storage_read_failed");
          return "false";
        }),
      ]);
      // 준비 전에 받은 이벤트까지 버리도록 초기화보다 먼저 적용한다.
      if (!hasCollectingChanged && storedCollecting === "false") {
        client.setCollecting(false);
        dropTouch();
      }
      const anonymousId = storedAnonymousId || options.newId();
      writeStorage(ID_KEY, anonymousId);
      if (storedTouchJson && !pendingTouch && client.isCollecting) {
        try {
          const parsed = marketingTouchSchema.safeParse(
            JSON.parse(storedTouchJson),
          );
          if (parsed.success) {
            pendingTouch = parsed.data;
            setUtm(parsed.data);
          }
        } catch {
          console.warn("[analytics] invalid_stored_utm");
        }
      }
      identifiedUserId = storedUserId || null;
      client.initialize(anonymousId, options.newId());
    })());
  return {
    client,
    get ready() {
      return restoreFromStorage();
    },
    identify(userId) {
      const hasUserChanged = identifiedUserId !== userId;
      let anonymousId: string | undefined;
      if (hasUserChanged) {
        // 로그아웃·계정 전환 시 이전 사용자의 익명 ID와 유입 정보를 분리한다.
        if (identifiedUserId) {
          anonymousId = options.newId();
          client.setUtm(null);
          lastCampaignKey = "";
          pendingTouch = null;
          writeStorage(ID_KEY, anonymousId);
          writeStorage(UTM_KEY, "null");
        }
        identifiedUserId = userId;
        writeStorage(USER_KEY, userId ?? "");
      }
      if (anonymousId) client.setAnonymousId(anonymousId);
    },
    setUtm,
    setCollecting(isCollecting) {
      hasCollectingChanged = true;
      client.setCollecting(isCollecting);
      if (!isCollecting) dropTouch();
      writeStorage(ANALYTICS_COLLECTING_KEY, String(isCollecting));
      for (const listener of collectingListeners) listener();
    },
    subscribeCollecting(listener) {
      collectingListeners.add(listener);
      return () => {
        collectingListeners.delete(listener);
      };
    },
    get pendingTouch() {
      return pendingTouch;
    },
    // 응답을 기다리는 동안 새 접점이 들어왔으면 이전 요청의 성공으로 지우지 않는다.
    acknowledgeTouch(touchId) {
      if (pendingTouch?.touch_id === touchId) {
        pendingTouch = null;
        writeStorage(UTM_KEY, "null");
      }
    },
    subscribeTouch(listener) {
      touchListeners.add(listener);
      return () => {
        touchListeners.delete(listener);
      };
    },
    capture(values) {
      if (!client.isCollecting) return;
      let touch: MarketingTouch | null;
      try {
        touch = captureUtm(values, options.newId(), new Date().toISOString());
      } catch {
        console.warn("[analytics] invalid_campaign");
        return;
      }
      // UTM 없는 이동은 기존 접점을 유지한다. 이후 같은 캠페인으로 재유입하면 새 접점이다.
      if (!touch) {
        lastCampaignKey = "";
        return;
      }
      const campaignKey = JSON.stringify([
        touch.utm_source,
        touch.utm_medium,
        touch.utm_campaign,
        touch.utm_content,
        touch.utm_term,
      ]);
      if (campaignKey === lastCampaignKey) return;
      lastCampaignKey = campaignKey;
      pendingTouch = touch;
      setUtm(touch);
      writeStorage(UTM_KEY, JSON.stringify(touch));
      for (const listener of touchListeners) listener();
    },
  };
}
