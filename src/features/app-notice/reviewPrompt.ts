import { delay } from "es-toolkit";
import * as StoreReview from "expo-store-review";

import { APP_VERSION } from "@/constants/app.constants";
import { isShareExtension, isWeb } from "@/constants/platform.constants";

import { REVIEW_PROMPT } from "./appNotice.constants";
import {
  getReviewState,
  increaseReviewSaveCount,
  markReviewRequested,
} from "./noticeStorage";

const DAY_MS = 24 * 60 * 60 * 1000;

function isWithinCooldown(requestedAt: string | null, now: Date): boolean {
  if (requestedAt === null) {
    return false;
  }
  const elapsed = now.getTime() - new Date(requestedAt).getTime();
  // 날짜가 깨져 있으면(NaN) 쿨다운을 적용해 둔다 — 잘못된 값으로 반복 요청하는 쪽이 나쁘다.
  return Number.isNaN(elapsed) || elapsed < REVIEW_PROMPT.cooldownDays * DAY_MS;
}

/**
 * 링크 저장에 성공했을 때 후기(인앱 리뷰)를 요청할지 판단하고, 조건이 맞으면 OS 리뷰 창을 띄운다.
 * 띄웠으면 true.
 *
 * 우리 모달을 먼저 끼우지 않고 OS 창을 바로 띄운다 — iOS HIG·Android 가이드가 사전 질문 없이
 * "뭔가를 끝낸 자연스러운 시점에, 드물게" 띄우기를 요구한다(Apple 은 자체 리뷰 프롬프트를 심사에서 거절한다).
 * 앱 버전당 한 번·쿨다운으로 거르고, 저장 완료 스낵바가 지나간 뒤 띄운다. 노출 빈도는 OS 가 한 번 더 조절한다.
 *
 * 어떤 실패도 저장 흐름으로 번지지 않게 한다 — 후기 요청은 저장의 곁가지다.
 */
export async function requestReviewAfterSave(
  now: Date = new Date(),
): Promise<boolean> {
  // 웹엔 스토어가 없고, iOS 공유 익스텐션 프로세스에서는 리뷰 창을 띄울 수 없다.
  if (isWeb || isShareExtension()) {
    return false;
  }

  const saveCount = await increaseReviewSaveCount();
  if (saveCount < REVIEW_PROMPT.minSaveCount) {
    return false;
  }

  const { requestedAt, requestedVersion } = await getReviewState();
  if (requestedVersion === APP_VERSION || isWithinCooldown(requestedAt, now)) {
    return false;
  }

  try {
    // isAvailableAsync: 기기 능력(TestFlight·구형 안드로이드 제외) · hasAction: 실제로 보낼 곳이 있는지.
    const [isAvailable, hasAction] = await Promise.all([
      StoreReview.isAvailableAsync(),
      StoreReview.hasAction(),
    ]);
    if (!isAvailable || !hasAction) {
      return false;
    }

    await delay(REVIEW_PROMPT.delayMs);
    await StoreReview.requestReview();
  } catch (error) {
    console.error("[app-notice] 인앱 리뷰 요청 실패", error);
    return false;
  }

  // 띄운 뒤에만 기록한다 — 띄우지 못한 실행이 쿨다운을 먹지 않게.
  await markReviewRequested(now, APP_VERSION);
  return true;
}
