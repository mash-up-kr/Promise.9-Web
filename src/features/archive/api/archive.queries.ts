import { apiClient, type SuccessResponse } from "@shared/api";
import type { Folder } from "@shared/types/folder.types";
import type { FolderColor, Link } from "@shared/types/link.types";
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

interface LinkListData {
  items: Link[];
}

export interface BasicFolderCounts {
  all: number;
  uncategorized: number;
  favorites: number;
  trash: number;
}

export interface FoldersOverview {
  folders: Folder[];
  counts: BasicFolderCounts;
}

export interface ArchiveFolderDetail {
  title: string;
  links: Link[];
}

/** 기본(파생) 폴더 — 문자열 id → 제목·링크 필터. */
const PSEUDO_FOLDERS: Record<
  string,
  { title: string; params: Record<string, unknown> }
> = {
  all: { title: "전체", params: {} },
  uncategorized: { title: "미분류", params: { uncategorized: true } },
  favorites: { title: "즐겨찾기", params: { favorite: true } },
  trash: { title: "최근 삭제된 링크", params: { deleted: true } },
};

const archiveKeys = {
  root: () => ["archive"] as const,
  overview: () => [...archiveKeys.root(), "overview"] as const,
  folderDetail: (id: string) =>
    [...archiveKeys.root(), "folder-detail", id] as const,
};

export const archiveQueries = {
  keys: archiveKeys,
  // 보관함 폴더 목록 + 기본 폴더 카운트(전체·미분류·즐겨찾기·휴지통).
  overview: () =>
    queryOptions({
      queryKey: archiveKeys.overview(),
      queryFn: async ({ signal }) => {
        const { data } = await apiClient.get<SuccessResponse<FoldersOverview>>(
          "/folders",
          { signal },
        );
        return data.data;
      },
    }),
  // 폴더 상세 — 기본 폴더(문자열 id)면 필터, 사용자 폴더면 소속 링크.
  folderDetail: (id: string) =>
    queryOptions({
      queryKey: archiveKeys.folderDetail(id),
      queryFn: async ({ signal }): Promise<ArchiveFolderDetail> => {
        const pseudo = PSEUDO_FOLDERS[id];
        if (pseudo) {
          const { data } = await apiClient.get<SuccessResponse<LinkListData>>(
            "/links",
            { params: pseudo.params, signal },
          );
          return { title: pseudo.title, links: data.data.items };
        }
        const [linksRes, foldersRes] = await Promise.all([
          apiClient.get<SuccessResponse<LinkListData>>(`/folders/${id}/links`, {
            signal,
          }),
          apiClient.get<SuccessResponse<FoldersOverview>>("/folders", {
            signal,
          }),
        ]);
        const folder = foldersRes.data.data.folders.find(
          (f) => String(f.folderId) === id,
        );
        return {
          title: folder?.folderName ?? "폴더",
          links: linksRes.data.data.items,
        };
      },
    }),
};

export interface CreateFolderPayload {
  folderName: string;
  folderColor: FolderColor;
}

// POST /folders — 생성 후 목록(overview) 무효화로 새 폴더가 즉시 반영된다.
export function useCreateFolderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateFolderPayload) => {
      const { data } = await apiClient.post<SuccessResponse<Folder>>(
        "/folders",
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: archiveKeys.overview() });
    },
  });
}
