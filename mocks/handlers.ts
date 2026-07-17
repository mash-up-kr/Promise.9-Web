import type { FolderColor } from "@shared/types/link.types";
import type { AxiosRequestConfig } from "axios";
import type MockAdapter from "axios-mock-adapter";

import type { RemindType } from "@/features/link/link.constants";

import {
  addRecentKeyword,
  basicCounts,
  createFolder,
  createLink,
  deleteFolder,
  deleteLink,
  getLinkDetail,
  getPreview,
  getRecentKeywords,
  type ListLinksOptions,
  listFolders,
  listLinks,
  recentlyViewed,
  type UpdateFolderPatch,
  type UpdateLinkPatch,
  updateFolder,
  updateLink,
} from "./store";

type Reply = [number, unknown];

const ok = (data: unknown): Reply => [200, { success: true, data }];
const notFound = (): Reply => [
  404,
  {
    success: false,
    error: {
      code: 404,
      errorCode: 404,
      message: "Not found",
      timestamp: new Date().toISOString(),
    },
  },
];

const truthy = (v: unknown): boolean => v === true || v === "true";

function idFrom(url: string | undefined, re: RegExp): number | null {
  const m = re.exec(url ?? "");
  return m ? Number(m[1]) : null;
}

function body(config: AxiosRequestConfig): Record<string, unknown> {
  if (typeof config.data === "string") {
    try {
      return JSON.parse(config.data) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return (config.data as Record<string, unknown> | undefined) ?? {};
}

/** 단일 apiClient(axios)에 모든 mock 라우트를 등록한다. 응답은 서버 envelope(success+data). */
export function registerHandlers(mock: MockAdapter): void {
  // ---- 링크 ----
  mock.onGet("/links").reply((config) => {
    const p = (config.params ?? {}) as Record<string, unknown>;
    const opts: ListLinksOptions = {};
    if (truthy(p.uncategorized)) opts.folderId = null;
    else if (p.folderId !== undefined) opts.folderId = Number(p.folderId);
    if (p.favorite !== undefined) opts.favorite = truthy(p.favorite);
    if (p.deleted !== undefined) opts.deleted = truthy(p.deleted);
    if (p.category) opts.category = String(p.category);
    if (p.search) opts.search = String(p.search);
    if (p.limit) opts.limit = Number(p.limit);
    if (p.cursor) opts.cursor = String(p.cursor);
    return ok(listLinks(opts));
  });

  mock.onGet("/links/preview").reply((config) => {
    const url = String((config.params as Record<string, unknown>)?.url ?? "");
    return ok(getPreview(url));
  });

  mock
    .onGet("/links/recently-viewed")
    .reply(() => ok({ links: recentlyViewed() }));

  mock.onGet(/\/links\/\d+$/).reply((config) => {
    const id = idFrom(config.url, /\/links\/(\d+)$/);
    const detail =
      id !== null ? getLinkDetail(id, { markViewed: true }) : undefined;
    return detail ? ok(detail) : notFound();
  });

  mock.onPost("/links").reply((config) => {
    const b = body(config);
    return ok(
      createLink({
        url: String(b.url ?? ""),
        folderId:
          b.folderId === undefined || b.folderId === null
            ? null
            : Number(b.folderId),
        memo: (b.memo as string | null | undefined) ?? null,
        remindType: (b.remindType as RemindType | null | undefined) ?? null,
      }),
    );
  });

  mock.onPatch(/\/links\/\d+$/).reply((config) => {
    const id = idFrom(config.url, /\/links\/(\d+)$/);
    if (id === null) return notFound();
    const b = body(config);
    const patch: UpdateLinkPatch = {};
    if ("folderId" in b)
      patch.folderId = b.folderId === null ? null : Number(b.folderId);
    if ("memo" in b) patch.memo = (b.memo as string | null) ?? null;
    if ("isFavorite" in b) patch.isFavorite = Boolean(b.isFavorite);
    if ("tags" in b) patch.tags = b.tags as string[];
    if ("representativeTag" in b)
      patch.representativeTag = (b.representativeTag as string | null) ?? null;
    const updated = updateLink(id, patch);
    return updated ? ok(updated) : notFound();
  });

  mock.onDelete(/\/links\/\d+$/).reply((config) => {
    const id = idFrom(config.url, /\/links\/(\d+)$/);
    return id !== null && deleteLink(id) ? ok({ linkId: id }) : notFound();
  });

  // ---- 폴더 ----
  mock
    .onGet("/folders")
    .reply(() => ok({ folders: listFolders(), counts: basicCounts() }));

  mock.onGet(/\/folders\/\d+\/links$/).reply((config) => {
    const id = idFrom(config.url, /\/folders\/(\d+)\/links$/);
    return id !== null ? ok(listLinks({ folderId: id })) : notFound();
  });

  mock.onPost("/folders").reply((config) => {
    const b = body(config);
    return ok(
      createFolder({
        folderName: String(b.folderName ?? ""),
        folderColor: b.folderColor as FolderColor | undefined,
      }),
    );
  });

  mock.onPatch(/\/folders\/\d+$/).reply((config) => {
    const id = idFrom(config.url, /\/folders\/(\d+)$/);
    if (id === null) return notFound();
    const b = body(config);
    const patch: UpdateFolderPatch = {};
    if ("folderName" in b) patch.folderName = String(b.folderName);
    if ("folderColor" in b) patch.folderColor = b.folderColor as FolderColor;
    if ("sortOrder" in b) patch.sortOrder = Number(b.sortOrder);
    const updated = updateFolder(id, patch);
    return updated ? ok(updated) : notFound();
  });

  mock.onDelete(/\/folders\/\d+$/).reply((config) => {
    const id = idFrom(config.url, /\/folders\/(\d+)$/);
    return id !== null && deleteFolder(id) ? ok({ folderId: id }) : notFound();
  });

  // ---- 검색어 ----
  mock
    .onGet("/search/recent")
    .reply(() => ok({ keywords: getRecentKeywords() }));
  mock.onPost("/search/recent").reply((config) => {
    addRecentKeyword(String(body(config).keyword ?? ""));
    return ok({ keywords: getRecentKeywords() });
  });
}
