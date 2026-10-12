jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as StoreReview from "expo-store-review";

import { APP_NOTICE_STORAGE_KEYS, REVIEW_PROMPT } from "./appNotice.constants";
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

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
  mockIsAvailable.mockResolvedValue(true);
  mockHasAction.mockResolvedValue(true);
  mockRequestReview.mockResolvedValue(undefined);
});

test("저장 횟수가 기준에 못 미치면 요청하지 않는다", async () => {
  await expect(requestReviewAfterSave(NOW)).resolves.toBe(false);

  expect(mockRequestReview).not.toHaveBeenCalled();
});

test("기준 횟수째 저장에서 OS 리뷰 창을 띄우고 시각을 남긴다", async () => {
  await setSaveCount(REVIEW_PROMPT.minSaveCount - 1);

  await expect(requestReviewAfterSave(NOW)).resolves.toBe(true);

  expect(mockRequestReview).toHaveBeenCalledTimes(1);
  await expect(
    AsyncStorage.getItem(APP_NOTICE_STORAGE_KEYS.reviewRequestedAt),
  ).resolves.toBe(NOW.toISOString());
});

test("쿨다운 안에서는 다시 요청하지 않는다", async () => {
  await setSaveCount(REVIEW_PROMPT.minSaveCount * 3);
  await AsyncStorage.setItem(
    APP_NOTICE_STORAGE_KEYS.reviewRequestedAt,
    new Date("2026-09-11T09:00:00.000Z").toISOString(),
  );

  await expect(requestReviewAfterSave(NOW)).resolves.toBe(false);

  expect(mockRequestReview).not.toHaveBeenCalled();
});

test("쿨다운이 지나면 다시 요청한다", async () => {
  await setSaveCount(REVIEW_PROMPT.minSaveCount * 3);
  const longAgo = new Date(NOW);
  longAgo.setDate(longAgo.getDate() - REVIEW_PROMPT.cooldownDays - 1);
  await AsyncStorage.setItem(
    APP_NOTICE_STORAGE_KEYS.reviewRequestedAt,
    longAgo.toISOString(),
  );

  await expect(requestReviewAfterSave(NOW)).resolves.toBe(true);
});

test("리뷰 창을 띄울 수 없는 기기면 조용히 넘어간다 — 요청 이력도 남기지 않는다", async () => {
  await setSaveCount(REVIEW_PROMPT.minSaveCount);
  mockIsAvailable.mockResolvedValue(false);

  await expect(requestReviewAfterSave(NOW)).resolves.toBe(false);

  expect(mockRequestReview).not.toHaveBeenCalled();
  await expect(
    AsyncStorage.getItem(APP_NOTICE_STORAGE_KEYS.reviewRequestedAt),
  ).resolves.toBeNull();
});

test("리뷰 창이 실패해도 저장 흐름으로 에러를 던지지 않는다", async () => {
  await setSaveCount(REVIEW_PROMPT.minSaveCount);
  mockRequestReview.mockRejectedValue(new Error("ERR_STORE_REVIEW_FAILED"));

  await expect(requestReviewAfterSave(NOW)).resolves.toBe(false);
});

test("저장 횟수는 요청 여부와 무관하게 쌓인다", async () => {
  await requestReviewAfterSave(NOW);
  await requestReviewAfterSave(NOW);

  await expect(
    AsyncStorage.getItem(APP_NOTICE_STORAGE_KEYS.reviewSaveCount),
  ).resolves.toBe("2");
});
