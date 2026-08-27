import type { FolderListResponse } from "@shared/entities/folder/folder.queries";
import type { Folder } from "@shared/types/folder.types";

import { HOME_POLICY } from "./home.constants";
import type { HomeKeyword, RemindLink } from "./home.types";

/** 알림이 가까운 순 상위 N개. 빈 배열이면 호출부가 섹션을 숨긴다. */
export function selectRemindLinks(links: RemindLink[]): RemindLink[] {
  return [...links]
    .sort((a, b) => Date.parse(a.reminderAt) - Date.parse(b.reminderAt))
    .slice(0, HOME_POLICY.remind.maxLinks);
}

/**
 * 링크가 많은 순 상위 N개 키워드.
 *
 * 태그가 몇 개 안 붙은 초기 사용자에게 빈약한 섹션을 보여주지 않으려고, 링크 3개 이상인
 * 태그가 3종류 이상 모였을 때만 노출한다(시안 정책). 미달이면 빈 배열이라 섹션이 숨는다.
 */
export function selectTopKeywords(keywords: HomeKeyword[]): HomeKeyword[] {
  const eligible = keywords.filter(
    (keyword) => keyword.linkCount >= HOME_POLICY.keywords.minLinksPerTag,
  );

  if (eligible.length < HOME_POLICY.keywords.minVariety) {
    return [];
  }

  return eligible
    .sort((a, b) => b.linkCount - a.linkCount)
    .slice(0, HOME_POLICY.keywords.max);
}

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
 * 자주 열어본 폴더 상위 N개. 폴더 목록 쿼리의 `select` 로 쓴다.
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
    .slice(0, HOME_POLICY.frequentFolders.maxFolders)
    .map(toFolder);

  return { folders, hasAnyFolder: res.folders.length > 0 };
}
