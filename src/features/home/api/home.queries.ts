import { apiClient, type SuccessResponse } from "@shared/api";
import type { Folder } from "@shared/types/folder.types";
import type { Link } from "@shared/types/link.types";
import { queryOptions } from "@tanstack/react-query";

interface LinkListData {
  items: Link[];
}

interface FoldersData {
  folders: Folder[];
}

/** 홈 폴더 섹션 — 폴더 + 소속 링크. */
export interface HomeFolderSection {
  folder: Folder;
  links: Link[];
}

const homeKeys = {
  root: () => ["home"] as const,
  recent: () => [...homeKeys.root(), "recent"] as const,
  folderSections: () => [...homeKeys.root(), "folder-sections"] as const,
};

export const homeQueries = {
  keys: homeKeys,
  // 최근 저장 링크 (savedAt 내림차순 상위 9개).
  recentLinks: () =>
    queryOptions({
      queryKey: homeKeys.recent(),
      queryFn: async ({ signal }) => {
        // 최근저장은 이미지 유무와 무관하게 최신순 — 방금 저장한(썸네일 없는) 링크도 상위에 노출.
        const { data } = await apiClient.get<SuccessResponse<LinkListData>>(
          "/links",
          { params: { limit: 9, sort: "recent" }, signal },
        );
        return data.data.items;
      },
    }),
  // 마지막으로 저장한 폴더 순 — 각 폴더 + 소속 링크.
  folderSections: () =>
    queryOptions({
      queryKey: homeKeys.folderSections(),
      queryFn: async ({ signal }): Promise<HomeFolderSection[]> => {
        const { data } = await apiClient.get<SuccessResponse<FoldersData>>(
          "/folders",
          { signal },
        );
        const folders = [...data.data.folders].sort((a, b) =>
          (b.lastSavedAt ?? "").localeCompare(a.lastSavedAt ?? ""),
        );
        return Promise.all(
          folders.map(async (folder) => {
            const res = await apiClient.get<SuccessResponse<LinkListData>>(
              `/folders/${folder.folderId}/links`,
              { signal },
            );
            return { folder, links: res.data.data.items };
          }),
        );
      },
    }),
};
