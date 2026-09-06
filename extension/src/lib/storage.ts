import { createStorageEntry } from "./chromeStorage";
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

/**
 * 저장 기록은 `storage.session` 에 둔다 — 브라우저를 껐다 켜면 사라지는 게 맞는 값이고,
 * 재시도 한도도 시안 정책상 세션 단위다.
 */
const saveRecord = createStorageEntry<SaveRecord>("session", "save");

export function readSaveRecord(): Promise<SaveRecord | null> {
  return saveRecord.read();
}

export function writeSaveRecord(record: SaveRecord): Promise<void> {
  return saveRecord.write(record);
}

export function clearSaveRecord(): Promise<void> {
  return saveRecord.clear();
}

/**
 * 저장 기록 변경을 구독한다. background 가 저장을 끝내면 패널이 이걸로 결과를 받는다
 * (패널이 닫혀 있었어도 다시 열 때 readSaveRecord 로 같은 값을 읽는다).
 */
export function subscribeSaveRecord(
  onChange: (record: SaveRecord | null) => void,
): () => void {
  return saveRecord.subscribe(onChange);
}
