import AsyncStorage from "@react-native-async-storage/async-storage";

import { APP_NOTICE_STORAGE_KEYS } from "./appNotice.constants";

/**
 * 안내 기록은 기기 로컬에만 둔다(서버 정책 없음 · 웹은 쓰지 않는다).
 *
 * 읽기는 **실패해도 던지지 않는다** — 저장소 오류나 손상된 값 때문에 앱 실행이 막히는 쪽이
 * 안내 한 번을 놓치는 쪽보다 나쁘다. 대신 개발 로그는 남긴다.
 */
async function readItem(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.error("[app-notice] 안내 기록 읽기 실패", error);
    return null;
  }
}

async function writeItem(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.error("[app-notice] 안내 기록 저장 실패", error);
  }
}

function parseCount(raw: string | null): number {
  const parsed = Number(raw);
  // 손상된 값("abc")·빈 값은 0 부터 다시 센다 — 후기 요청을 늦추기만 하므로 안전한 쪽이다.
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

/** "나중에" 로 건너뛴 권유 대상 버전. 없으면 null. */
export function getSnoozedUpdateVersion(): Promise<string | null> {
  return readItem(APP_NOTICE_STORAGE_KEYS.snoozedUpdateVersion);
}

export function snoozeUpdateVersion(version: string): Promise<void> {
  return writeItem(APP_NOTICE_STORAGE_KEYS.snoozedUpdateVersion, version);
}

export interface ReviewState {
  /** 앱에서 링크를 저장한 누적 횟수. */
  saveCount: number;
  /** 마지막으로 후기 요청을 띄운 시각(ISO). 아직 없으면 null. */
  requestedAt: string | null;
}

export async function getReviewState(): Promise<ReviewState> {
  const [saveCount, requestedAt] = await Promise.all([
    readItem(APP_NOTICE_STORAGE_KEYS.reviewSaveCount),
    readItem(APP_NOTICE_STORAGE_KEYS.reviewRequestedAt),
  ]);

  return { saveCount: parseCount(saveCount), requestedAt };
}

/** 저장 횟수를 1 올리고 올린 값을 돌려준다. */
export async function increaseReviewSaveCount(): Promise<number> {
  const next =
    parseCount(await readItem(APP_NOTICE_STORAGE_KEYS.reviewSaveCount)) + 1;
  await writeItem(APP_NOTICE_STORAGE_KEYS.reviewSaveCount, String(next));
  return next;
}

export function markReviewRequested(now: Date): Promise<void> {
  return writeItem(
    APP_NOTICE_STORAGE_KEYS.reviewRequestedAt,
    now.toISOString(),
  );
}
