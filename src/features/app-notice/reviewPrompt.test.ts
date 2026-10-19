jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("@/constants/app.constants", () => ({ APP_VERSION: "1.2.0" }));

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as StoreReview from "expo-store-review";
import { AppState } from "react-native";

import { queryClient } from "@/lib/queryClient";

import { appNoticeQueries } from "./api/appNotice.queries";
import { APP_NOTICE_STORAGE_KEYS, REVIEW_PROMPT } from "./appNotice.constants";
import type { AppRelease } from "./appNotice.contracts";
import { requestReviewAfterSave } from "./reviewPrompt";

const mockIsAvailable = StoreReview.isAvailableAsync as jest.Mock;
const mockHasAction = StoreReview.hasAction as jest.Mock;
const mockRequestReview = StoreReview.requestReview as jest.Mock;

const NOW = new Date("2026-10-11T09:00:00.000Z");

async function setSaveCount(count: number) {
  await AsyncStorage.setItem(
    APP_NOTICE_STORAGE_KEYS.reviewSaveCount,
    String(count),
  );
}

async function setRequested(requestedAt: Date, version = "1.1.0") {
  await AsyncStorage.setItem(
    APP_NOTICE_STORAGE_KEYS.reviewRequestedAt,
    requestedAt.toISOString(),
  );
  await AsyncStorage.setItem(
    APP_NOTICE_STORAGE_KEYS.reviewRequestedVersion,
    version,
  );
}

// 앱 실행 때 읽어 둔 기준 파일을 흉내 낸다 — 후기 정책은 그 안의 review 블록에서 온다.
function setRemotePolicy(review: AppRelease["review"]) {
  queryClient.setQueryData(appNoticeQueries.release().queryKey, {
    ios: { latestVersion: "1.2.0", minSupportedVersion: "1.0.0" },
    android: { latestVersion: "1.2.0", minSupportedVersion: "1.0.0" },
    review,
  });
}

function daysBefore(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

// 띄우기 전 지연은 가짜 타이머로 건너뛴다.
async function run(now = NOW) {
  const result = requestReviewAfterSave(now);
  await jest.advanceTimersByTimeAsync(REVIEW_PROMPT.delayMs);
  return result;
}

beforeEach(async () => {
  jest.useFakeTimers();
  queryClient.clear();
  await AsyncStorage.clear();
  jest.clearAllMocks();
  mockIsAvailable.mockResolvedValue(true);
  mockHasAction.mockResolvedValue(true);
  mockRequestReview.mockResolvedValue(undefined);
});

afterEach(() => {
  jest.useRealTimers();
});

test("저장 횟수가 기준에 못 미치면 요청하지 않는다", async () => {
  await expect(run()).resolves.toBe(false);

  expect(mockRequestReview).not.toHaveBeenCalled();
});

test("기준 횟수째 저장에서 OS 리뷰 창을 띄우고 시각·버전을 남긴다", async () => {
  await setSaveCount(REVIEW_PROMPT.minSaveCount - 1);

  await expect(run()).resolves.toBe(true);

  expect(mockRequestReview).toHaveBeenCalledTimes(1);
  await expect(
    AsyncStorage.getItem(APP_NOTICE_STORAGE_KEYS.reviewRequestedAt),
  ).resolves.toBe(NOW.toISOString());
  await expect(
    AsyncStorage.getItem(APP_NOTICE_STORAGE_KEYS.reviewRequestedVersion),
  ).resolves.toBe("1.2.0");
});

// 저장 완료 스낵바('보기')와 닫히는 시트 위에 OS 창이 겹치지 않게 한 박자 쉬고 띄운다.
test("조건이 맞아도 바로 띄우지 않고 지연 뒤에 띄운다", async () => {
  await setSaveCount(REVIEW_PROMPT.minSaveCount - 1);

  const result = requestReviewAfterSave(NOW);
  await jest.advanceTimersByTimeAsync(REVIEW_PROMPT.delayMs - 1);
  expect(mockRequestReview).not.toHaveBeenCalled();

  await jest.advanceTimersByTimeAsync(1);
  await expect(result).resolves.toBe(true);
  expect(mockRequestReview).toHaveBeenCalledTimes(1);
});

test("쿨다운 안에서는 다시 요청하지 않는다", async () => {
  await setSaveCount(REVIEW_PROMPT.minSaveCount * 3);
  await setRequested(daysBefore(NOW, 30));

  await expect(run()).resolves.toBe(false);

  expect(mockRequestReview).not.toHaveBeenCalled();
});

test("쿨다운이 지나고 앱도 업데이트됐으면 다시 요청한다", async () => {
  await setSaveCount(REVIEW_PROMPT.minSaveCount * 3);
  await setRequested(daysBefore(NOW, REVIEW_PROMPT.cooldownDays + 1), "1.1.0");

  await expect(run()).resolves.toBe(true);
});

// iOS 는 같은 버전에 두 번 묻지 않고, Android 는 묻는 횟수에 할당량이 있다 — 버전당 한 번이면 충분하다.
test("같은 버전에서 이미 띄웠으면 쿨다운이 지나도 다시 요청하지 않는다", async () => {
  await setSaveCount(REVIEW_PROMPT.minSaveCount * 3);
  await setRequested(daysBefore(NOW, REVIEW_PROMPT.cooldownDays + 1), "1.2.0");

  await expect(run()).resolves.toBe(false);

  expect(mockRequestReview).not.toHaveBeenCalled();
});

test("리뷰 창을 띄울 수 없는 기기면 조용히 넘어간다 — 요청 이력도 남기지 않는다", async () => {
  await setSaveCount(REVIEW_PROMPT.minSaveCount);
  mockIsAvailable.mockResolvedValue(false);

  await expect(run()).resolves.toBe(false);

  expect(mockRequestReview).not.toHaveBeenCalled();
  await expect(
    AsyncStorage.getItem(APP_NOTICE_STORAGE_KEYS.reviewRequestedAt),
  ).resolves.toBeNull();
});

test("리뷰 창이 실패해도 저장 흐름으로 에러를 던지지 않고 기록도 남기지 않는다", async () => {
  await setSaveCount(REVIEW_PROMPT.minSaveCount);
  mockRequestReview.mockRejectedValue(new Error("ERR_STORE_REVIEW_FAILED"));

  await expect(run()).resolves.toBe(false);

  await expect(
    AsyncStorage.getItem(APP_NOTICE_STORAGE_KEYS.reviewRequestedVersion),
  ).resolves.toBeNull();
});

test("기다리는 사이 앱이 뒤로 갔으면 요청하지 않고 기록도 남기지 않는다", async () => {
  await setSaveCount(REVIEW_PROMPT.minSaveCount - 1);
  Object.assign(AppState, { currentState: "background" });

  try {
    await expect(run()).resolves.toBe(false);
  } finally {
    Object.assign(AppState, { currentState: "active" });
  }

  expect(mockRequestReview).not.toHaveBeenCalled();
  await expect(
    AsyncStorage.getItem(APP_NOTICE_STORAGE_KEYS.reviewRequestedVersion),
  ).resolves.toBeNull();
});

// 기록은 OS 창을 띄운 뒤에 남으므로, 지연 중에 들어온 두 번째 저장도 검사를 통과해 버린다.
test("지연 중에 두 번째 저장이 들어와도 요청은 한 번만 나간다", async () => {
  await setSaveCount(REVIEW_PROMPT.minSaveCount - 1);

  const first = requestReviewAfterSave(NOW);
  const second = requestReviewAfterSave(NOW);
  await jest.advanceTimersByTimeAsync(REVIEW_PROMPT.delayMs);

  await expect(first).resolves.toBe(true);
  await expect(second).resolves.toBe(false);
  expect(mockRequestReview).toHaveBeenCalledTimes(1);
});

test("저장 횟수는 요청 여부와 무관하게 쌓인다", async () => {
  await run();
  await run();

  await expect(
    AsyncStorage.getItem(APP_NOTICE_STORAGE_KEYS.reviewSaveCount),
  ).resolves.toBe("2");
});

describe("원격 설정(기준 파일 review 블록)", () => {
  test("끄면 조건이 맞아도 요청하지 않는다 — 저장 횟수는 계속 센다", async () => {
    setRemotePolicy({ enabled: false });
    await setSaveCount(REVIEW_PROMPT.minSaveCount - 1);

    await expect(run()).resolves.toBe(false);

    expect(mockRequestReview).not.toHaveBeenCalled();
    await expect(
      AsyncStorage.getItem(APP_NOTICE_STORAGE_KEYS.reviewSaveCount),
    ).resolves.toBe(String(REVIEW_PROMPT.minSaveCount));
  });

  test("저장 횟수 기준을 원격 값으로 바꾼다", async () => {
    setRemotePolicy({ minSaveCount: 2 });
    await setSaveCount(1);

    await expect(run()).resolves.toBe(true);
  });

  test("쿨다운을 원격 값으로 바꾼다", async () => {
    setRemotePolicy({ cooldownDays: 10 });
    await setSaveCount(REVIEW_PROMPT.minSaveCount * 3);
    await setRequested(daysBefore(NOW, 11), "1.1.0");

    await expect(run()).resolves.toBe(true);
  });
});
