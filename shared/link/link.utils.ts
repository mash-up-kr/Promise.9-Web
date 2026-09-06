const FIRST_URL_PATTERN = /https?:\/\/\S+/i;

/** 공유 텍스트에서 첫 http(s) URL 을 뽑는다. Android 는 "제목\nURL" 처럼 섞어 보낸다. */
export function extractFirstUrl(text: string): string | null {
  return FIRST_URL_PATTERN.exec(text)?.[0] ?? null;
}
