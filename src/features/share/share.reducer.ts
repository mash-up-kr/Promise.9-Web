// 정책(Figma · 외부 공유 저장): 같은 세션에서 3회 연속 실패하면 retry-limit 화면으로 전환.
const RETRY_LIMIT = 3;

export type ShareSaveState =
  | { phase: "editing"; failCount: number }
  | { phase: "saving"; failCount: number }
  | { phase: "success"; linkId: number }
  | { phase: "duplicate"; linkId: number | null }
  | { phase: "failed"; failCount: number }
  | { phase: "retry-limit" }
  | { phase: "invalid-url" };

export type ShareSaveAction =
  | { type: "SAVE_REQUESTED" }
  | { type: "SAVE_SUCCEEDED"; linkId: number }
  | { type: "SAVE_DUPLICATED"; linkId: number | null }
  | { type: "SAVE_FAILED" }
  | { type: "SAVE_REJECTED_INVALID_URL" };

export const INITIAL_SHARE_SAVE_STATE: ShareSaveState = {
  phase: "editing",
  failCount: 0,
};

export function shareSaveReducer(
  state: ShareSaveState,
  action: ShareSaveAction,
): ShareSaveState {
  switch (action.type) {
    case "SAVE_REQUESTED":
      if (state.phase === "editing" || state.phase === "failed") {
        return { phase: "saving", failCount: state.failCount };
      }
      return state;
    case "SAVE_SUCCEEDED":
      if (state.phase === "saving") {
        return { phase: "success", linkId: action.linkId };
      }
      return state;
    case "SAVE_DUPLICATED":
      if (state.phase === "saving") {
        return { phase: "duplicate", linkId: action.linkId };
      }
      return state;
    // 공유 텍스트가 URL 이 아니면(Android EXTRA_TEXT 등) 서버 왕복 없이 안내로 끝낸다.
    case "SAVE_REJECTED_INVALID_URL":
      if (state.phase === "editing" || state.phase === "failed") {
        return { phase: "invalid-url" };
      }
      return state;
    case "SAVE_FAILED":
      if (state.phase === "saving") {
        const failCount = state.failCount + 1;
        return failCount >= RETRY_LIMIT
          ? { phase: "retry-limit" }
          : { phase: "failed", failCount };
      }
      return state;
  }
}
