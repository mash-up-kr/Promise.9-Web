import type { LinkProcessingStatus } from "@shared/types/link.types";
import { isNil } from "es-toolkit";

/**
 * AI 요약 영역 노출 여부 — 처리 중이거나 요약 텍스트가 있을 때만 보인다.
 * 실패·미지원(요약 없음)이면 영역 자체를 숨긴다(정책). 스크린이 래퍼 조건부 렌더에 재사용한다.
 */
export function shouldShowAiSummary(
  status: LinkProcessingStatus,
  summary: string | null,
): boolean {
  return status === "PENDING" || (!isNil(summary) && summary.trim() !== "");
}

// Hermes 의 URL 구현이 불완전해 정규식으로 파싱한다.
export function getDomain(url: string): string | null {
  const matched = url.match(/^https?:\/\/([^/?#:]+)/i);
  if (!matched) return null;
  return matched[1].toLowerCase().replace(/^www\./, "");
}
