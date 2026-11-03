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
  /** 이후 이벤트에 회원 ID를 적용한다. 로그아웃·계정 전환 시 익명 ID와 유입 정보를 초기화한다. */
  identify(userId: string | null): void;
  suspendIdentity(): void;
  /** 인증 확인 중 유지할 UTM을 구분하기 위해 현재 기기·회원 정보 중 어디서 왔는지 기억한다. */
  setUtm(utm: AnalyticsUtm | null, source?: "local" | "account"): void;
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
  let utmSource: "local" | "account" = "local";
  const touchListeners = new Set<() => void>();
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
  const setUtm: AnalyticsRuntime["setUtm"] = (utm, source = "local") => {
    client.setUtm(utm);
    utmSource = source;
  };
  let readyPromise: Promise<void> | undefined;
  const restoreFromStorage = () =>
    (readyPromise ??= (async () => {
      const [storedAnonymousId, storedTouchJson, storedUserId] =
        await Promise.all([
          readStorage(ID_KEY),
          readStorage(UTM_KEY),
          readStorage(USER_KEY),
        ]);
      const anonymousId = storedAnonymousId || options.newId();
      writeStorage(ID_KEY, anonymousId);
      if (storedTouchJson && !pendingTouch) {
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
      client.setIdentity(userId, anonymousId);
    },
    suspendIdentity() {
      // 회원 정보 확인 중에는 계정의 사용자 ID·UTM을 빼고 현재 기기의 유입 정보는 유지한다.
      client.setIdentity(null);
      if (utmSource === "account") client.setUtm(null);
    },
    setUtm,
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
      setUtm(touch, "local");
      writeStorage(UTM_KEY, JSON.stringify(touch));
      for (const listener of touchListeners) listener();
    },
  };
}
