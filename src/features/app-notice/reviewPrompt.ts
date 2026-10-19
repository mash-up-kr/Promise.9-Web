import { delay } from "es-toolkit";
import * as StoreReview from "expo-store-review";
import { AppState } from "react-native";

import { APP_VERSION } from "@/constants/app.constants";
import { isShareExtension, isWeb } from "@/constants/platform.constants";
import { queryClient } from "@/lib/queryClient";

import { appNoticeQueries } from "./api/appNotice.queries";
import { REVIEW_PROMPT } from "./appNotice.constants";
import {
  getReviewState,
  increaseReviewSaveCount,
  markReviewRequested,
} from "./noticeStorage";

const DAY_MS = 24 * 60 * 60 * 1000;

// 기록은 OS 창을 띄운 뒤에 남으므로, 지연 중에 들어온 두 번째 저장이 검사를 또 통과하지 않게 막는다.
let isRequesting = false;

function isWithinCooldown(
  requestedAt: string | null,
  now: Date,
  cooldownDays: number,
): boolean {
  if (requestedAt === null) {
    return false;
  }
  const elapsed = now.getTime() - new Date(requestedAt).getTime();
  // 날짜가 깨져 있으면(NaN) 쿨다운을 적용해 둔다 — 잘못된 값으로 반복 요청하는 쪽이 나쁘다.
  return Number.isNaN(elapsed) || elapsed < cooldownDays * DAY_MS;
}

// 앱 실행 때 읽어 둔 기준 파일의 review 블록이 기본값을 덮어쓴다 — 아직 못 읽었으면 기본값(fail-open).
function readReviewPolicy() {
  const remote = queryClient.getQueryData(
    appNoticeQueries.release().queryKey,
  )?.review;
  return { enabled: true, ...REVIEW_PROMPT, ...remote };
}

/**
 * 링크 저장에 성공했을 때 후기(인앱 리뷰)를 요청할지 판단하고, 조건이 맞으면 OS 리뷰 창을 띄운다.
 * 띄웠으면 true.
 *
 * 우리 모달을 먼저 끼우지 않고 OS 창을 바로 띄운다 — iOS HIG·Android 가이드가 사전 질문 없이
 * "뭔가를 끝낸 자연스러운 시점에, 드물게" 띄우기를 요구한다(Apple 은 자체 리뷰 프롬프트를 심사에서 거절한다).
 * 앱 버전당 한 번·쿨다운으로 거르고, 저장 완료 스낵바가 지나간 뒤 띄운다. 노출 빈도는 OS 가 한 번 더 조절한다.
 * 횟수·쿨다운·끄기는 기준 파일(`public/app-release.json` 의 review)로 배포 없이 바꾼다.
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

  const policy = readReviewPolicy();
  const saveCount = await increaseReviewSaveCount();
  if (!policy.enabled || saveCount < policy.minSaveCount) {
    return false;
  }

  const { requestedAt, requestedVersion } = await getReviewState();
  if (
    requestedVersion === APP_VERSION ||
    isWithinCooldown(requestedAt, now, policy.cooldownDays)
  ) {
    return false;
  }

  if (isRequesting) {
    return false;
  }
  isRequesting = true;
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
    // 기다리는 사이 앱이 뒤로 갔으면 창이 뜨지 않는데(Android 는 성공으로 끝난다) 이 버전의 기회만 쓴다.
    if (AppState.currentState === "background") {
      return false;
    }
    await StoreReview.requestReview();
    // 띄운 뒤에만 기록한다 — 띄우지 못한 실행이 쿨다운을 먹지 않게.
    await markReviewRequested(now, APP_VERSION);
    return true;
  } catch (error) {
    console.error("[app-notice] 인앱 리뷰 요청 실패", error);
    return false;
  } finally {
    isRequesting = false;
  }
}
