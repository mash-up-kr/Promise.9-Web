import type { FolderListResponse } from "@shared/entities/folder/folder.queries";
import {
  type LinkListResponse,
  toLink,
} from "@shared/entities/link/link.queries";
import type { RecommendationResponse } from "@shared/entities/recommendation/recommendation.queries";
import type { Folder } from "@shared/types/folder.types";
import { uniqBy } from "es-toolkit";

import { LINK_PROCESSING } from "@/features/link/link.constants";
import { isWithinProcessingWindow } from "@/features/link/link.utils";

import { HOME_POLICY } from "./home.constants";
import type { HomeKeyword, RemindLink } from "./home.types";

/**
 * 다시 볼 링크. `GET /links?reminder=true&sortBy=reminderAt&order=asc` 응답의 `select` 로 쓴다.
 *
 * 정렬(알림 가까운 순)·상한은 서버 요청이 맡으므로 순서를 그대로 둔다. 알림이 없는 항목은
 * 계약상 오지 않지만, 오더라도 날짜 배지가 빈 카드를 그리지 않도록 뺀다. 빈 배열이면 섹션이 숨는다.
 */
export function selectRemindLinks(res: LinkListResponse): RemindLink[] {
  return res.links.flatMap((item) =>
    item.reminderAt === null
      ? []
      : [{ ...toLink(item), reminderAt: item.reminderAt }],
  );
}

/**
 * 많이 저장한 키워드. `GET /recommendations` 응답의 `select` 로 쓴다.
 *
 * 노출 조건(링크 3개 이상인 후보 3개 이상)·정렬(링크 많은 순)은 서버 정책 — 미달이면 data 가
 * null 로 와서 빈 배열이 되고 섹션이 숨는다. 같은 이름의 폴더와 태그가 함께 오면 칩이 겹쳐
 * 보이므로 앞(링크 많은 쪽)만 남긴다.
 */
export function selectTopKeywords(res: RecommendationResponse): HomeKeyword[] {
  if (!res) {
    return [];
  }

  return uniqBy(res.items, (item) => item.label).map((item) => ({
    name: item.label,
    linkCount: item.linkCount,
  }));
}

/**
 * 저장 직후 서버가 제목·썸네일·요약을 채우는 동안(processingStatus PENDING) 목록을 다시 조회할 간격.
 * 링크 목록 쿼리의 `refetchInterval` 함수로 쓴다.
 *
 * 제목이 먼저 채워져도 요약·태그가 끝나기 전이면 PENDING 이라 계속 조회하고, 실패(FAILED)는
 * 제목이 비어 있어도 멈춘다. 상태가 끝내 확정되지 않는 경우를 대비해 저장 시각 상한도 함께 본다
 * (상세 재조회와 같은 정책).
 */
export function getProcessingRefetchInterval(
  res: LinkListResponse | undefined,
  now: number = Date.now(),
): number | false {
  const hasProcessingLink = res?.links.some(
    (item) =>
      item.processingStatus === "PENDING" &&
      isWithinProcessingWindow(item.savedAt, now),
  );
  return hasProcessingLink ? LINK_PROCESSING.pollIntervalMs : false;
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
