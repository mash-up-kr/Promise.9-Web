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

export interface FrequentFolders {
  /** 자주 열어본 순 상위 N개. 링크가 없는 폴더는 제외 — 제목만 있는 빈 캐러셀을 막는다. */
  folders: Folder[];
  /** 사용자 폴더 존재 여부 — "폴더 없음" 빈 상태와 "전부 빈 폴더라 숨김"을 가른다. */
  hasAnyFolder: boolean;
}

/**
 * 자주 열어본 폴더 상위 N개.
 *
 * `viewCount` 는 서버가 아직 내려주지 않아(feature/folder-view-count 미머지) 전부 0 으로 묶이고,
 * 그동안은 마지막 저장 시각 최신순으로 폴백한다. 서버가 머지되면 그대로 조회수 순이 된다.
 */
export function selectFrequentFolders(
  res: FolderListResponse,
): FrequentFolders {
  const folders = res.folders
    .filter((folder) => folder.linkCount > 0)
    .sort(
      (a, b) =>
        (b.viewCount ?? 0) - (a.viewCount ?? 0) ||
        toSavedTime(b.lastSavedAt) - toSavedTime(a.lastSavedAt),
    )
    .slice(0, HOME_FREQUENT_FOLDER_LIMIT)
    .map(toFolder);

  return { folders, hasAnyFolder: res.folders.length > 0 };
}

export const homeQueries = {
  recentLinks: () =>
    linkQueries.list({
      sortBy: "savedAt",
      order: "desc",
      limit: HOME_RECENT_LINK_LIMIT,
    }),
  folderLinks: (folderId: number) =>
    linkQueries.list({ folderId, limit: HOME_FOLDER_LINK_LIMIT }),
  // 보관함과 같은 GET /folders 캐시를 공유하고 select 만 홈용으로 바꾼다.
  // 시안의 "캐시 있으면 화면 유지, 없을 때만 에러 화면" 은 useSuspenseQuery 의 기본
  // 동작이다(v5 defaultThrowOnError = 캐시 없을 때만 throw) — 별도 옵션이 필요 없다.
  frequentFolders: () => ({
    ...folderQueries.list(),
    select: selectFrequentFolders,
  }),
};
