import { isAlreadySavedLinkError } from "@shared/entities/link/link.errors";

/**
 * 이 횟수만큼 연속 실패하면 "잠시 후 다시 시도해주세요" 로 전환하고 재시도 버튼을 내린다.
 * 시안 `chrome-extension / save-failed-retry-limit` 정책: 반복 실패(3회+).
 */
export const MAX_SAVE_ATTEMPTS = 3;

export type SavePhase =
  | "saving"
  | "success"
  | "duplicate"
  | "failed"
  | "retry-limit";

/**
 * 저장 한 건의 진행 상태.
 *
 * 화면이 아니라 background 가 소유하고 storage 에 남긴다 — 저장 도중 패널이 닫혀도
 * 저장은 계속되고, 다시 열었을 때 마지막 결과를 그대로 보여주기 위해서다.
 */
export interface SaveSession {
  url: string;
  phase: SavePhase;
  /** 저장 성공 시 서버가 준 링크 id. 그 외에는 null. */
  linkId: number | null;
  /** 연속 실패 횟수. 성공·중복이거나 다른 링크로 넘어가면 0 으로 돌아간다. */
  failureCount: number;
}

/** 저장 시작. 같은 링크를 다시 시도하는 것이면 실패 횟수를 이어간다. */
export function startSaving(
  url: string,
  previous: SaveSession | null,
): SaveSession {
  return {
    url,
    phase: "saving",
    linkId: null,
    failureCount: previous?.url === url ? previous.failureCount : 0,
  };
}

export function resolveSuccess(
  session: SaveSession,
  linkId: number,
): SaveSession {
  return { ...session, phase: "success", linkId, failureCount: 0 };
}

export function resolveFailure(
  session: SaveSession,
  error: unknown,
): SaveSession {
  // 중복은 재시도해도 결과가 같다 — 실패로 세면 애먼 재시도 한도에 걸린다.
  if (isAlreadySavedLinkError(error)) {
    return { ...session, phase: "duplicate", failureCount: 0 };
  }

  const failureCount = session.failureCount + 1;

  return {
    ...session,
    phase: failureCount >= MAX_SAVE_ATTEMPTS ? "retry-limit" : "failed",
    failureCount,
  };
}
