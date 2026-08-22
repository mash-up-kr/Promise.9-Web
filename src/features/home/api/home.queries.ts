import type { Folder } from "@shared/types/folder.types";

import {
  type FolderListResponse,
  folderQueries,
} from "@/entities/folder/folder.queries";
import { linkQueries } from "@/entities/link/link.queries";

/** 시안 정책 — 최근 저장 최대 9개. */
export const HOME_RECENT_LINK_LIMIT = 9;
/** 시안 정책 — 자주 보는 폴더 최대 2개. */
export const HOME_FREQUENT_FOLDER_LIMIT = 2;
/** 시안 정책 — 자주 보는 폴더의 폴더당 링크 최대 9개. */
export const HOME_FOLDER_LINK_LIMIT = 9;

type FolderListItem = FolderListResponse["folders"][number];

const toFolder = (item: FolderListItem): Folder => ({
  folderId: item.folderId,
  folderName: item.folderName,
  linkCount: item.linkCount,
  lastSavedAt: item.lastSavedAt,
});

// 저장 이력이 없는 폴더는 항상 뒤로 — GET /folders 의 lastSavedAt 정렬 규칙과 같다.
const toSavedTime = (lastSavedAt: string | null) =>
  lastSavedAt ? Date.parse(lastSavedAt) : Number.NEGATIVE_INFINITY;

/**
 * 자주 열어본 폴더 상위 N개.
 *
 * `viewCount` 는 서버가 아직 내려주지 않아(feature/folder-view-count 미머지) 전부 0 으로 묶이고,
 * 그동안은 마지막 저장 시각 최신순으로 폴백한다. 서버가 머지되면 그대로 조회수 순이 된다.
 */
export function selectFrequentFolders(res: FolderListResponse): Folder[] {
  return [...res.folders]
    .sort(
      (a, b) =>
        (b.viewCount ?? 0) - (a.viewCount ?? 0) ||
        toSavedTime(b.lastSavedAt) - toSavedTime(a.lastSavedAt),
    )
    .slice(0, HOME_FREQUENT_FOLDER_LIMIT)
    .map(toFolder);
}

/**
 * 캐시가 있으면 화면을 유지하고 캐시가 없을 때만 에러 화면으로 던진다(시안 정책).
 *
 * `useSuspenseQuery` 는 기본적으로 모든 에러를 던져서, 새로고침이 실패하면 이미 보고 있던
 * 화면까지 에러로 바뀐다. 캐시가 있는 실패는 스낵바로만 알리는 게 시안이라 조건을 좁힌다.
 */
const throwOnlyWithoutCache = (
  _error: Error,
  query: { state: { data: unknown } },
) => query.state.data === undefined;

export const homeQueries = {
  recentLinks: () => ({
    ...linkQueries.list({
      sortBy: "savedAt",
      order: "desc",
      limit: HOME_RECENT_LINK_LIMIT,
    }),
    throwOnError: throwOnlyWithoutCache,
  }),
  folderLinks: (folderId: number) => ({
    ...linkQueries.list({ folderId, limit: HOME_FOLDER_LINK_LIMIT }),
    throwOnError: throwOnlyWithoutCache,
  }),
  // 보관함과 같은 GET /folders 캐시를 공유하고 select 만 홈용으로 바꾼다.
  frequentFolders: () => ({
    ...folderQueries.list(),
    select: selectFrequentFolders,
    throwOnError: throwOnlyWithoutCache,
  }),
};
