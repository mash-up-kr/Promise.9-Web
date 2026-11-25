import { isClientError } from "@shared/api/errors";
import { logoutRequest } from "@shared/entities/auth/auth.queries";
import * as SecureStore from "expo-secure-store";

export interface LogoutRequest {
  refreshToken: string;
  pushToken: string | null;
}

const PENDING_LOGOUT_KEY = "promise9_pending_logout";

// 저장소 읽기-쓰기가 겹쳐 서로의 기록을 덮지 않게 한 줄로 세운다.
let storageQueue: Promise<unknown> = Promise.resolve();
let flushing: Promise<void> | undefined;

function updatePending(
  update: (pending: LogoutRequest[]) => LogoutRequest[],
): Promise<LogoutRequest[]> {
  const next = storageQueue.then(async () => {
    const raw = await SecureStore.getItemAsync(PENDING_LOGOUT_KEY);
    const pending = update(raw ? (JSON.parse(raw) as LogoutRequest[]) : []);
    if (pending.length)
      await SecureStore.setItemAsync(
        PENDING_LOGOUT_KEY,
        JSON.stringify(pending),
      );
    else await SecureStore.deleteItemAsync(PENDING_LOGOUT_KEY);
    return pending;
  });
  storageQueue = next.catch(() => {});
  return next;
}

// 보내는 중인 요청 — 버튼과 flush 가 같은 기록을 겹쳐 보내지 않고, 등록 전 flush 가 이것까지 기다리게 한다.
const sending = new Map<string, Promise<boolean>>();

const isSame = (a: LogoutRequest, b: LogoutRequest) =>
  a.refreshToken === b.refreshToken && a.pushToken === b.pushToken;

/** 한 기록을 보낸다. 성공하거나 다시 보내도 소용없는 4xx 면 기록을 지우고 true. 던지지 않는다. */
function send(request: LogoutRequest): Promise<boolean> {
  // 같은 세션이라도 푸시 토큰이 다르면 따로 보낸다 — 합치면 푸시 토큰이 서버에 가지 않는다.
  const key = JSON.stringify([request.refreshToken, request.pushToken]);
  const inFlight = sending.get(key);
  if (inFlight) return inFlight;
  const next = (async () => {
    try {
      await logoutRequest(request.refreshToken, request.pushToken ?? undefined);
    } catch (error) {
      if (!isClientError(error)) {
        console.warn(
          "[logout] 서버 로그아웃 실패 — 다음 실행에 다시 보낸다",
          error,
        );
        return false;
      }
    }
    try {
      await updatePending((list) =>
        list.filter((item) => !isSame(item, request)),
      );
    } catch (error) {
      console.warn("[logout] 로그아웃 기록 삭제 실패", error);
    }
    return true;
  })().finally(() => sending.delete(key));
  sending.set(key, next);
  return next;
}

/**
 * 로그아웃 요청을 보안 저장소에 기록한 뒤 보낸다(서버 #158 권장 흐름).
 * 이번 요청만 기다리고 남은 기록은 뒤에서 보낸다. 보내지 못하면 기록을 남겨 다음 실행(flushPendingLogout)에서 같은 값으로 다시 보낸다. 던지지 않는다.
 */
export async function sendLogout(request: LogoutRequest): Promise<void> {
  try {
    await updatePending((pending) => [...pending, request]);
  } catch (error) {
    console.warn("[logout] 로그아웃 기록 실패 — 한 번만 보낸다", error);
    await logoutRequest(
      request.refreshToken,
      request.pushToken ?? undefined,
    ).catch(() => console.warn("[logout] 서버 로그아웃 실패"));
    return;
  }
  // 보내지 못했으면(오프라인 등) 남은 기록도 지금 다시 보내 봐야 소용없다.
  if (await send(request)) void flushPendingLogout();
}

/** 남은 로그아웃 요청을 보낸다. 던지지 않는다. */
export function flushPendingLogout(): Promise<void> {
  flushing ??= (async () => {
    try {
      const pending = await updatePending((list) => list);
      for (const request of pending) await send(request);
    } catch (error) {
      console.warn("[logout] 남은 로그아웃 처리 실패", error);
    } finally {
      flushing = undefined;
    }
  })();
  return flushing;
}
