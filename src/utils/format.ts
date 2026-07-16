import { dayjs } from "@/lib/dayjs";

/**
 * 링크 저장일 표시 정책 (홈·검색 공통) — 달력일 기준으로 상대 시간 또는 절대 날짜를 반환한다.
 *
 * - 당일: `오늘` / 1일 전: `어제` / 2~6일 전: `N일 전`
 * - 7~13일: `1주 전` / 14~20일: `2주 전` / 21~29일: `3주 전`
 * - 30일 이상: `YYYY.MM.DD`
 *
 * @param base 기준 시각(조회 시각). 기본값은 현재 시각.
 * @example
 * formatRelativeDate("2026-07-13T09:00:00"); // "어제"
 * formatRelativeDate("2026-05-28T09:00:00"); // "2026.05.28"
 */
export function formatRelativeDate(
  date: string | Date,
  base: Date = new Date(),
): string {
  const days = dayjs(base)
    .startOf("day")
    .diff(dayjs(date).startOf("day"), "day");

  if (days <= 0) return "오늘";
  if (days === 1) return "어제";
  if (days <= 6) return `${days}일 전`;
  if (days <= 13) return "1주 전";
  if (days <= 20) return "2주 전";
  if (days <= 29) return "3주 전";
  return dayjs(date).format("YYYY.MM.DD");
}

/**
 * 링크 상세 상단의 저장일 표시 — 항상 절대 날짜(`YYYY.MM.DD`), 상대 표현 없음.
 * 로컬 타임존 변환으로 날짜가 하루 밀리는 것을 막기 위해 UTC 기준으로 파싱한다
 * (savedAt 은 캘린더 날짜 의미의 ISO 8601 문자열).
 *
 * @example
 * formatSavedDate("2026-06-19T00:00:00.000Z"); // "2026.06.19"
 */
export function formatSavedDate(savedAt: string): string {
  return dayjs.utc(savedAt).format("YYYY.MM.DD");
}
