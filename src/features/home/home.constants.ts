/**
 * 홈 시안 정책 수치 — 섹션별 노출 조건·최대 개수.
 *
 * 출처: Figma 홈 정책 프레임. 섹션 단위로 묶어 두면 "키워드 정책이 뭐였지" 를
 * 한 곳에서 읽을 수 있고, 숫자가 어느 섹션 것인지 이름에 다시 적을 필요가 없다.
 */
export const HOME_POLICY = {
  /** 다시 볼 링크 */
  remind: {
    /** 최대 노출 링크 수 (알림 날짜 가까운 순) */
    maxLinks: 9,
  },
  /** 많이 저장한 키워드 — 노출 조건(링크 3개 이상인 후보 3개 이상)은 서버(GET /recommendations)가 판단한다 */
  keywords: {
    /** 최대 노출 개수 (서버 limit) */
    max: 12,
    /** 한 줄에 놓는 칩 수 — 균등 분할이 아니라 줄당 상한 */
    perRow: 6,
  },
  /** 최근 저장 */
  recentSave: {
    /** 최대 노출 링크 수 (저장 최신순) */
    maxLinks: 9,
  },
  /** 자주 보는 폴더 */
  frequentFolders: {
    /** 최대 노출 폴더 수 */
    maxFolders: 2,
    /** 폴더당 링크 최대 수 */
    maxLinksPerFolder: 9,
  },
} as const;
