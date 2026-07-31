/** 태그 생성 주체 — 사용자 직접 추가 / 규칙 기반 / AI 생성 */
export type LinkTagSourceType = "user" | "rule" | "ai";

/** 요약·태그·연관 링크 비동기 처리 상태 — 서버 LinkDetailResponseDto.processingStatus 기반 */
export type LinkProcessingStatus =
  | "PENDING"
  | "SUCCESS"
  | "NEEDS_REVIEW"
  | "FAILED";

/** 링크 태그 — 서버 LinkTagResponseDto 기반. 목록의 대표 태그·상세의 태그 목록이 공유한다. */
export interface LinkTag {
  tagId: number;
  name: string;
  sourceType: LinkTagSourceType;
  sortOrder: number | null;
}

/**
 * 폴더 색상 — 디자인 시스템 folder 토큰(global.css `--color-folder-*`)의 variant 이름.
 * 백엔드가 폴더별 색을 내려주기 전까지는 mock 에서만 채운다(임시).
 */
export type FolderColor =
  | "gray"
  | "blue"
  | "slate"
  | "purple"
  | "orange-red"
  | "green"
  | "teal"
  | "pink"
  | "red"
  | "lime"
  | "yellow-green"
  | "yellow"
  | "orange";

/** 링크 목록·상세 공통 코어. 각 화면 타입이 이를 확장한다. */
export interface LinkBase {
  linkId: number;
  title: string;
  source: string;
  thumbnailUrl: string | null;
  savedAt: string;
}

/** GET /links 목록 아이템. representativeTag 는 대표 태그 정책 구현 전까지 항상 null. */
export interface Link extends LinkBase {
  representativeTag: LinkTag | null;
}

/** 상세의 소속 폴더 참조 — 서버 응답 안에 임베드되는 축약 shape(폴더 전체 정보는 `Folder` 참고). */
export interface LinkFolderRef {
  folderId: number;
  folderName: string;
}

/** GET /links/{id} 상세. */
export interface LinkDetail extends LinkBase {
  url: string;
  /** 소속 폴더 (미분류면 null) */
  folder: LinkFolderRef | null;
  /** 폴더 배지 색. 백엔드 미제공 — mock/UI 전용(folder 가 null 이면 무시). */
  folderColor?: FolderColor;
  /** 원문 발행 시각 (ISO 8601). 없으면 null */
  publishedAt: string | null;
  /** 마지막 조회 시각. 조회 이력이 없으면 null */
  viewedAt: string | null;
  processingStatus: LinkProcessingStatus;
  /** AI 요약. processingStatus 로 처리 중·실패·완료 상태를 구분 */
  aiSummary: string | null;
  /** 태그 목록. 처리 중이면 null, 처리 완료 후 결과가 없으면 빈 배열 */
  tags: LinkTag[] | null;
  memo: string | null;
  isFavorite: boolean;
  /** 연관 링크. 처리 중이면 null, 처리 완료 후 결과가 없으면 빈 배열 */
  relatedLinks: RelatedLink[] | null;
  /** 썸네일 대표색 — 백엔드 미제공, mock/UI 전용(동적 배경에 사용). */
  dominantColor?: string;
}

/** 연관 링크 카드용 — 서버 RelatedLinkDto 기반. */
export interface RelatedLink {
  linkId: number;
  title: string;
  thumbnailUrl: string;
}

/** GET /links/preview 응답 — 저장 전 OG 메타데이터(표시 전용). */
export interface LinkPreview {
  title: string;
  source: string;
  thumbnailUrl: string | null;
  description?: string;
}
