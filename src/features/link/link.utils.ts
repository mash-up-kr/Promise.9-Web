import type {
  LinkDetail,
  LinkProcessingStatus,
} from "@shared/types/link.types";
import { isNil } from "es-toolkit";

import { LINK_PROCESSING } from "./link.constants";

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

/**
 * 저장한 지 얼마 안 돼 아직 서버 처리를 기다릴 만한 링크인지.
 * 해석할 수 없는 시각은 기다리지 않는 쪽으로 본다 — 끝나지 않는 폴링보다 늦은 갱신이 낫다.
 */
export function isWithinProcessingWindow(
  savedAt: string,
  now: number = Date.now(),
): boolean {
  const saved = Date.parse(savedAt);
  return Number.isFinite(saved) && now - saved < LINK_PROCESSING.maxWaitMs;
}

/**
 * 링크 상세를 다시 조회할 간격 — 상세 쿼리의 `refetchInterval` 함수로 쓴다.
 *
 * 상세 응답은 처리 상태를 직접 주므로 PENDING 인 동안만 조회하고 확정되면 멈춘다.
 * 상태가 끝내 확정되지 않는 경우를 대비해 저장 시각 상한도 함께 본다.
 */
export function getDetailRefetchInterval(
  detail: Pick<LinkDetail, "processingStatus" | "savedAt"> | undefined,
  now: number = Date.now(),
): number | false {
  if (detail?.processingStatus !== "PENDING") {
    return false;
  }
  return isWithinProcessingWindow(detail.savedAt, now)
    ? LINK_PROCESSING.pollIntervalMs
    : false;
}
