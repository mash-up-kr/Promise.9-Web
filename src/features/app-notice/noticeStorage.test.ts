jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

import AsyncStorage from "@react-native-async-storage/async-storage";

import { APP_NOTICE_STORAGE_KEYS } from "./appNotice.constants";
import {
  getReviewState,
  getSnoozedUpdateVersion,
  increaseReviewSaveCount,
  markReviewRequested,
  snoozeUpdateVersion,
} from "./noticeStorage";

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

describe("업데이트 스누즈", () => {
  test("건너뛴 버전을 저장하고 다시 읽는다", async () => {
    await snoozeUpdateVersion("1.3.0");

    await expect(getSnoozedUpdateVersion()).resolves.toBe("1.3.0");
  });

  test("기록이 없으면 null", async () => {
    await expect(getSnoozedUpdateVersion()).resolves.toBeNull();
  });

  test("저장소가 실패해도 null 로 읽는다 — 안내 때문에 앱이 멈추지 않는다", async () => {
    jest
      .spyOn(AsyncStorage, "getItem")
      .mockRejectedValueOnce(new Error("storage down"));

    await expect(getSnoozedUpdateVersion()).resolves.toBeNull();
  });
});

describe("후기 요청 기록", () => {
  test("기록이 없으면 저장 0회·요청 이력 없음", async () => {
    await expect(getReviewState()).resolves.toEqual({
      saveCount: 0,
      requestedAt: null,
    });
  });

  test("저장 횟수를 1 씩 올리고 올린 값을 돌려준다", async () => {
    await expect(increaseReviewSaveCount()).resolves.toBe(1);
    await expect(increaseReviewSaveCount()).resolves.toBe(2);

    await expect(getReviewState()).resolves.toMatchObject({ saveCount: 2 });
  });

  test("숫자가 아닌 값이 남아 있으면 0 부터 센다", async () => {
    await AsyncStorage.setItem(APP_NOTICE_STORAGE_KEYS.reviewSaveCount, "abc");

    await expect(getReviewState()).resolves.toMatchObject({ saveCount: 0 });
    await expect(increaseReviewSaveCount()).resolves.toBe(1);
  });

  test("요청 시각을 ISO 로 남긴다", async () => {
    await markReviewRequested(new Date("2026-10-11T09:00:00.000Z"));

    await expect(getReviewState()).resolves.toMatchObject({
      requestedAt: "2026-10-11T09:00:00.000Z",
    });
  });
});
