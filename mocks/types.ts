import type {
  FolderColor,
  LinkProcessingStatus,
} from "@shared/types/link.types";

import type { RemindType } from "@/features/link/link.constants";

/**
 * 스토어 내 링크 레코드 — 리스트 `Link` + 상세 `LinkDetail` 의 합집합(단일 진실).
 * 화면이 소비하는 DTO 는 store 의 투영(projection)으로 만든다.
 */
export interface LinkRecord {
  linkId: number;
  url: string | null;
  title: string;
  source: string | null;
  thumbnailUrl: string | null;
  savedAt: string;
  publishedAt: string | null;
  /** 소속 폴더 (null = 미분류) — 폴더 관계의 유일한 출처 */
  folderId: number | null;
  /** 태그명 배열. 읽을 때 LinkTag 객체로 투영 */
  tags: string[];
  /** 리스트 카드 대표 태그명 (tags 중 하나 or null) */
  representativeTag: string | null;
  processingStatus: LinkProcessingStatus;
  aiSummary: string | null;
  memo: string | null;
  isFavorite: boolean;
  /** 연관 링크 = 다른 링크 id 참조 */
  relatedLinkIds: number[];
  remindType: RemindType | null;
  dominantColor: string | null;
  /** 상세 열람 시각(최근 본) — 시드 null, 스토어 관리 */
  viewedAt: string | null;
  /** 삭제 시각(soft-delete, 휴지통) — 시드 null, 스토어 관리 */
  deletedAt: string | null;
}

/** 스토어 내 폴더 레코드. linkCount·lastSavedAt 는 파생(저장하지 않음). */
export interface FolderRecord {
  folderId: number;
  folderName: string;
  folderColor: FolderColor;
  sortOrder: number;
}
