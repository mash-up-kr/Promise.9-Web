// Hermes 의 URL 구현이 불완전해 정규식으로 파싱한다.
export function getDomain(url: string): string | null {
  const matched = url.match(/^https?:\/\/([^/?#:]+)/i);
  if (!matched) return null;
  return matched[1].toLowerCase().replace(/^www\./, "");
}
