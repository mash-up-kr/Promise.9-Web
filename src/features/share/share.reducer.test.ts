import { INITIAL_SHARE_SAVE_STATE, shareSaveReducer } from "./share.reducer";

test("초기 상태는 editing 이다", () => {
  expect(INITIAL_SHARE_SAVE_STATE).toEqual({ phase: "editing", failCount: 0 });
});

test("저장 요청 시 saving 으로 전환한다", () => {
  const state = shareSaveReducer(INITIAL_SHARE_SAVE_STATE, {
    type: "SAVE_REQUESTED",
  });
  expect(state).toEqual({ phase: "saving", failCount: 0 });
});

test("저장 성공 시 linkId 와 함께 success 로 전환한다", () => {
  const state = shareSaveReducer(
    { phase: "saving", failCount: 0 },
    { type: "SAVE_SUCCEEDED", linkId: 42 },
  );
  expect(state).toEqual({ phase: "success", linkId: 42 });
});

test("중복 저장이면 duplicate 로 전환한다", () => {
  const state = shareSaveReducer(
    { phase: "saving", failCount: 0 },
    { type: "SAVE_DUPLICATED", linkId: 42 },
  );
  expect(state).toEqual({ phase: "duplicate", linkId: 42 });
});

test("저장 실패 시 failed 로 전환하고 실패 횟수를 센다", () => {
  const state = shareSaveReducer(
    { phase: "saving", failCount: 0 },
    { type: "SAVE_FAILED" },
  );
  expect(state).toEqual({ phase: "failed", failCount: 1 });
});

test("failed 에서 다시 시도하면 같은 실패 횟수로 saving 이 된다", () => {
  const state = shareSaveReducer(
    { phase: "failed", failCount: 2 },
    { type: "SAVE_REQUESTED" },
  );
  expect(state).toEqual({ phase: "saving", failCount: 2 });
});

test("동일 세션에서 3회 연속 실패하면 retry-limit 으로 전환한다", () => {
  const state = shareSaveReducer(
    { phase: "saving", failCount: 2 },
    { type: "SAVE_FAILED" },
  );
  expect(state).toEqual({ phase: "retry-limit" });
});

test("결과 상태(success 등)에서 무관한 액션은 무시한다", () => {
  const success = { phase: "success", linkId: 1 } as const;
  expect(shareSaveReducer(success, { type: "SAVE_FAILED" })).toBe(success);
});

test("URL 형식이 아니면 저장 요청 없이 invalid-url 로 전환한다", () => {
  const state = shareSaveReducer(INITIAL_SHARE_SAVE_STATE, {
    type: "SAVE_REJECTED_INVALID_URL",
  });
  expect(state).toEqual({ phase: "invalid-url" });
});
