/**
 * 사이드패널 ↔ background 메시지.
 *
 * 문자열 리터럴을 여기저기 흩뿌리지 않고 이 파일 한 곳에서만 정의한다
 * (docs/conventions/extension.md).
 */

export const MESSAGE_TYPE = {
  /** 저장 요청. background 가 받아서 수행하고 결과는 storage 에 남긴다(응답하지 않는다). */
  saveLink: "SAVE_LINK",
  /** 마지막 저장 요청을 그대로 다시 시도한다. */
  retrySave: "RETRY_SAVE",
} as const;

export interface SaveLinkPayload {
  url: string;
  /** 미분류면 null(서버 계약). */
  folderId: number | null;
  memo: string | null;
  /** 타임존을 포함한 ISO 8601 미래 시각. null 이면 리마인드 없음. */
  reminderAt: string | null;
}

export interface SaveLinkMessage {
  type: typeof MESSAGE_TYPE.saveLink;
  payload: SaveLinkPayload;
}

export interface RetrySaveMessage {
  type: typeof MESSAGE_TYPE.retrySave;
}

export type ExtensionMessage = SaveLinkMessage | RetrySaveMessage;

/** background 의 onMessage 는 무엇이든 받을 수 있어 좁히기가 필요하다. */
export function isExtensionMessage(value: unknown): value is ExtensionMessage {
  if (typeof value !== "object" || value === null) return false;
  const { type } = value as { type?: unknown };

  return type === MESSAGE_TYPE.saveLink || type === MESSAGE_TYPE.retrySave;
}
