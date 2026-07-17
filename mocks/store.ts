import type { CursorPagination } from "@shared/api/api.types";
import type { Folder } from "@shared/types/folder.types";
import type {
  FolderColor,
  Link,
  LinkDetail,
  LinkPreview,
  LinkTag,
  RelatedLink,
} from "@shared/types/link.types";

import type { RemindType } from "@/features/link/link.constants";

import foldersSeed from "./data/folders.json";
import linksSeed from "./data/links.json";
import searchSeed from "./data/search.json";
import type { FolderRecord, LinkRecord } from "./types";

interface Db {
  links: Map<number, LinkRecord>;
  folders: Map<number, FolderRecord>;
  recentKeywords: string[];
  tagIds: Map<string, number>;
  seq: { link: number; folder: number; tag: number };
}

let db: Db | undefined;

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const nowIso = (): string => new Date().toISOString();
const maxId = (ids: number[]): number =>
  ids.reduce((m, n) => Math.max(m, n), 0);

/** 시드에서 인메모리 스토어를 재구성한다(새로고침 = 리셋). */
export function resetStore(): void {
  const links = clone(linksSeed as unknown as LinkRecord[]);
  const folders = clone(foldersSeed as unknown as FolderRecord[]);

  const tagIds = new Map<string, number>();
  let tagSeq = 1;
  for (const l of links) {
    for (const t of l.tags) if (!tagIds.has(t)) tagIds.set(t, tagSeq++);
  }

  db = {
    links: new Map(links.map((l) => [l.linkId, l])),
    folders: new Map(folders.map((f) => [f.folderId, f])),
    recentKeywords: [...(searchSeed.recentKeywords ?? [])],
    tagIds,
    seq: {
      link: maxId(links.map((l) => l.linkId)) + 1,
      folder: maxId(folders.map((f) => f.folderId)) + 1,
      tag: tagSeq,
    },
  };
}

function store(): Db {
  if (!db) resetStore();
  return db as Db;
}

// ---------- 태그 ----------
function tagId(name: string): number {
  const d = store();
  const existing = d.tagIds.get(name);
  if (existing !== undefined) return existing;
  const id = d.seq.tag++;
  d.tagIds.set(name, id);
  return id;
}

function toLinkTag(name: string, sortOrder: number): LinkTag {
  return { tagId: tagId(name), name, sourceType: "ai", sortOrder };
}

// ---------- 투영(record → DTO) ----------
function toLink(rec: LinkRecord): Link {
  return {
    linkId: rec.linkId,
    title: rec.title,
    source: rec.source ?? "",
    thumbnailUrl: rec.thumbnailUrl,
    savedAt: rec.savedAt,
    representativeTag: rec.representativeTag
      ? toLinkTag(rec.representativeTag, 0)
      : null,
  };
}

function toFolder(rec: FolderRecord): Folder {
  const members = activeLinks().filter((l) => l.folderId === rec.folderId);
  const lastSavedAt = members.reduce<string | null>(
    (acc, l) => (acc === null || l.savedAt > acc ? l.savedAt : acc),
    null,
  );
  return {
    folderId: rec.folderId,
    folderName: rec.folderName,
    linkCount: members.length,
    lastSavedAt,
  };
}

function toLinkDetail(rec: LinkRecord): LinkDetail {
  const d = store();
  const folder =
    rec.folderId !== null ? d.folders.get(rec.folderId) : undefined;
  const relatedLinks: RelatedLink[] = rec.relatedLinkIds
    .map((id) => d.links.get(id))
    .filter((l): l is LinkRecord => l !== undefined && l.deletedAt === null)
    .map((l) => ({
      linkId: l.linkId,
      title: l.title,
      thumbnailUrl: l.thumbnailUrl ?? "",
    }));

  return {
    linkId: rec.linkId,
    title: rec.title,
    source: rec.source ?? "",
    thumbnailUrl: rec.thumbnailUrl,
    savedAt: rec.savedAt,
    url: rec.url ?? "",
    folder: folder
      ? { folderId: folder.folderId, folderName: folder.folderName }
      : null,
    folderColor: folder?.folderColor,
    publishedAt: rec.publishedAt,
    viewedAt: rec.viewedAt,
    processingStatus: rec.processingStatus,
    aiSummary: rec.aiSummary,
    tags: rec.tags.map(toLinkTag),
    memo: rec.memo,
    isFavorite: rec.isFavorite,
    relatedLinks,
    dominantColor: rec.dominantColor ?? undefined,
  };
}

// ---------- 헬퍼 ----------
function activeLinks(): LinkRecord[] {
  return [...store().links.values()].filter((l) => l.deletedAt === null);
}

const bySavedAtDesc = (a: LinkRecord, b: LinkRecord): number =>
  a.savedAt < b.savedAt ? 1 : a.savedAt > b.savedAt ? -1 : 0;

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function previewFor(url: string): LinkPreview {
  const match = [...store().links.values()].find((l) => l.url === url);
  if (match) {
    return {
      title: match.title,
      source: match.source ?? hostOf(url),
      thumbnailUrl: match.thumbnailUrl,
    };
  }
  const host = hostOf(url);
  return { title: host, source: host, thumbnailUrl: null };
}

// ---------- 셀렉터: 링크 ----------
export interface ListLinksOptions {
  /** undefined=무시, null=미분류 */
  folderId?: number | null;
  favorite?: boolean;
  /** 기본 false(활성). true 면 휴지통 */
  deleted?: boolean;
  search?: string;
  category?: string;
  limit?: number;
  cursor?: string | null;
}

export interface LinkListResult {
  items: Link[];
  pagination: CursorPagination;
}

export function listLinks(options: ListLinksOptions = {}): LinkListResult {
  const wantDeleted = options.deleted ?? false;
  let rows = [...store().links.values()].filter(
    (l) => (l.deletedAt !== null) === wantDeleted,
  );

  if (options.folderId !== undefined) {
    rows = rows.filter((l) => l.folderId === options.folderId);
  }
  if (options.favorite !== undefined) {
    rows = rows.filter((l) => l.isFavorite === options.favorite);
  }
  if (options.category) {
    rows = rows.filter((l) => l.tags.includes(options.category as string));
  }
  if (options.search) {
    const q = options.search.toLowerCase();
    rows = rows.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.tags.some((t) => t.toLowerCase().includes(q)) ||
        (l.memo ?? "").toLowerCase().includes(q),
    );
  }

  rows.sort(bySavedAtDesc);

  const limit = options.limit ?? rows.length;
  const start = options.cursor ? Number(options.cursor) : 0;
  const page = rows.slice(start, start + limit);
  const nextStart = start + limit;
  const hasNext = nextStart < rows.length;

  return {
    items: page.map(toLink),
    pagination: {
      nextCursor: hasNext ? String(nextStart) : null,
      hasNext,
      limit,
    },
  };
}

/** 최근 본 링크 — viewedAt 내림차순. */
export function recentlyViewed(limit = 20): Link[] {
  return activeLinks()
    .filter((l) => l.viewedAt !== null)
    .sort((a, b) => ((a.viewedAt ?? "") < (b.viewedAt ?? "") ? 1 : -1))
    .slice(0, limit)
    .map(toLink);
}

export interface GetLinkDetailOptions {
  markViewed?: boolean;
}

export function getLinkDetail(
  id: number,
  options: GetLinkDetailOptions = {},
): LinkDetail | undefined {
  const rec = store().links.get(id);
  if (!rec || rec.deletedAt !== null) return undefined;
  if (options.markViewed) rec.viewedAt = nowIso();
  return toLinkDetail(rec);
}

// ---------- 셀렉터: 폴더 ----------
export function listFolders(): Folder[] {
  return [...store().folders.values()]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(toFolder);
}

export interface BasicCounts {
  all: number;
  uncategorized: number;
  favorites: number;
  trash: number;
}

/** 보관함 "기본 폴더" 파생 카운트. */
export function basicCounts(): BasicCounts {
  const active = activeLinks();
  return {
    all: active.length,
    uncategorized: active.filter((l) => l.folderId === null).length,
    favorites: active.filter((l) => l.isFavorite).length,
    trash: [...store().links.values()].filter((l) => l.deletedAt !== null)
      .length,
  };
}

// ---------- 프리뷰 ----------
export function getPreview(url: string): LinkPreview {
  return previewFor(url);
}

// ---------- 뮤테이션: 링크 ----------
export interface CreateLinkInput {
  url: string;
  folderId: number | null;
  memo: string | null;
  remindType: RemindType | null;
}

export interface CreatedLink {
  linkId: number;
  url: string;
  savedAt: string;
}

export function createLink(input: CreateLinkInput): CreatedLink {
  const d = store();
  const linkId = d.seq.link++;
  const savedAt = nowIso();
  const preview = previewFor(input.url);
  const rec: LinkRecord = {
    linkId,
    url: input.url,
    title: preview.title,
    source: preview.source,
    thumbnailUrl: preview.thumbnailUrl,
    savedAt,
    publishedAt: null,
    folderId: input.folderId,
    tags: [],
    representativeTag: null,
    processingStatus: "SUCCESS",
    aiSummary: null,
    memo: input.memo,
    isFavorite: false,
    relatedLinkIds: [],
    remindType: input.remindType,
    dominantColor: null,
    viewedAt: null,
    deletedAt: null,
  };
  d.links.set(linkId, rec);
  return { linkId, url: input.url, savedAt };
}

export type UpdateLinkPatch = Partial<
  Pick<
    LinkRecord,
    "folderId" | "memo" | "isFavorite" | "tags" | "representativeTag"
  >
>;

export function updateLink(
  id: number,
  patch: UpdateLinkPatch,
): LinkDetail | undefined {
  const rec = store().links.get(id);
  if (!rec || rec.deletedAt !== null) return undefined;
  if (patch.folderId !== undefined) rec.folderId = patch.folderId;
  if (patch.memo !== undefined) rec.memo = patch.memo;
  if (patch.isFavorite !== undefined) rec.isFavorite = patch.isFavorite;
  if (patch.tags !== undefined) rec.tags = patch.tags;
  if (patch.representativeTag !== undefined) {
    rec.representativeTag = patch.representativeTag;
  }
  return toLinkDetail(rec);
}

/** soft-delete. */
export function deleteLink(id: number): boolean {
  const rec = store().links.get(id);
  if (!rec || rec.deletedAt !== null) return false;
  rec.deletedAt = nowIso();
  return true;
}

// ---------- 뮤테이션: 폴더 ----------
export interface CreateFolderInput {
  folderName: string;
  folderColor?: FolderColor;
}

export function createFolder(input: CreateFolderInput): Folder {
  const d = store();
  const folderId = d.seq.folder++;
  const sortOrder =
    maxId([...d.folders.values()].map((f) => f.sortOrder + 1)) || 0;
  const rec: FolderRecord = {
    folderId,
    folderName: input.folderName,
    folderColor: input.folderColor ?? "blue",
    sortOrder,
  };
  d.folders.set(folderId, rec);
  return toFolder(rec);
}

export type UpdateFolderPatch = Partial<
  Pick<FolderRecord, "folderName" | "folderColor" | "sortOrder">
>;

export function updateFolder(
  id: number,
  patch: UpdateFolderPatch,
): Folder | undefined {
  const rec = store().folders.get(id);
  if (!rec) return undefined;
  if (patch.folderName !== undefined) rec.folderName = patch.folderName;
  if (patch.folderColor !== undefined) rec.folderColor = patch.folderColor;
  if (patch.sortOrder !== undefined) rec.sortOrder = patch.sortOrder;
  return toFolder(rec);
}

/** 폴더 삭제 — 소속 링크는 미분류로 이동. */
export function deleteFolder(id: number): boolean {
  const d = store();
  if (!d.folders.has(id)) return false;
  for (const l of d.links.values()) {
    if (l.folderId === id) l.folderId = null;
  }
  d.folders.delete(id);
  return true;
}

// ---------- 검색어 ----------
export function getRecentKeywords(): string[] {
  return [...store().recentKeywords];
}

export function addRecentKeyword(keyword: string): void {
  const kw = keyword.trim();
  if (!kw) return;
  const d = store();
  d.recentKeywords = [kw, ...d.recentKeywords.filter((k) => k !== kw)].slice(
    0,
    10,
  );
}
