import type { SaveLinkPayload } from "./messages";
import type { SaveSession } from "./saveSession";

/**
 * 저장 한 건의 기록 — 진행 상태 + 그때 보낸 요청.
 *
 * 요청까지 같이 두는 이유: 실패 화면의 '다시 시도' 는 패널이 한 번 닫혔다 열린 뒤일 수 있어
 * 화면 메모리에 남아 있으리라 기대할 수 없다.
 */
export interface SaveRecord {
  session: SaveSession;
  request: SaveLinkPayload;
}

const SAVE_KEY = "save";
const LOGGED_IN_KEY = "loggedIn";

/**
 * 저장 기록은 `storage.session` 에 둔다 — 브라우저를 껐다 켜면 사라지는 게 맞는 값이고,
 * 재시도 한도도 시안 정책상 세션 단위다.
 */
export async function readSaveRecord(): Promise<SaveRecord | null> {
  const stored = await chrome.storage.session.get(SAVE_KEY);

  return (stored[SAVE_KEY] as SaveRecord | undefined) ?? null;
}

export async function writeSaveRecord(record: SaveRecord): Promise<void> {
  await chrome.storage.session.set({ [SAVE_KEY]: record });
}

export async function clearSaveRecord(): Promise<void> {
  await chrome.storage.session.remove(SAVE_KEY);
}

/**
 * 저장 기록 변경을 구독한다. background 가 저장을 끝내면 패널이 이걸로 결과를 받는다
 * (패널이 닫혀 있었어도 다시 열 때 readSaveRecord 로 같은 값을 읽는다).
 */
export function subscribeSaveRecord(
  onChange: (record: SaveRecord | null) => void,
): () => void {
  const listener = (
    changes: Record<string, chrome.storage.StorageChange>,
    areaName: string,
  ) => {
    if (areaName !== "session" || !(SAVE_KEY in changes)) return;
    onChange((changes[SAVE_KEY]?.newValue as SaveRecord | undefined) ?? null);
  };

  chrome.storage.onChanged.addListener(listener);

  return () => chrome.storage.onChanged.removeListener(listener);
}

/**
 * 로그인 여부.
 *
 * ⚠️ 임시 구현: 이번 단계의 인증은 앱/웹과 같은 마스터 토큰(빌드 타임 주입)이라 실제 세션이 없다.
 * 시안의 로그인 화면 흐름만 그대로 태우기 위해 로컬 플래그로 대체한다. 실제 소셜 로그인(#auth)이
 * 붙으면 이 두 함수만 토큰 저장소 기반으로 갈아끼운다.
 */
export async function readLoggedIn(): Promise<boolean> {
  const stored = await chrome.storage.local.get(LOGGED_IN_KEY);

  return stored[LOGGED_IN_KEY] === true;
}

export async function writeLoggedIn(loggedIn: boolean): Promise<void> {
  await chrome.storage.local.set({ [LOGGED_IN_KEY]: loggedIn });
}
