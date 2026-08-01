import { apiClient, isApiError, type SuccessResponse } from "@shared/api";
import {
  folderToneToHex,
  hexToFolderTone,
} from "@shared/folder/folder.constants";
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { FOLDER_ERROR_CODE } from "../archive.constants";
import type { CreateFolderInput } from "../archive.contracts";
import type {
  ArchiveFolder,
  ArchiveFolderData,
  SystemFolderKey,
} from "../archive.types";

interface SystemFolderCount {
  linkCount: number;
}

interface FolderListItem {
  folderId: number;
  folderName: string;
  color: string;
  linkCount: number;
  lastSavedAt: string | null;
}

interface FolderListResponse {
  systemFolders: Record<SystemFolderKey, SystemFolderCount>;
  folders: FolderListItem[];
}

const folderKeys = {
  root: () => ["folder"] as const,
  list: () => [...folderKeys.root(), "list"] as const,
};

/** GET /folders 응답을 보관함 UI 모델로 변환한다. */
export function toArchiveFolderData(
  res: FolderListResponse,
): ArchiveFolderData {
  // 기본 폴더의 표시명·순서는 SYSTEM_FOLDERS 가 갖고 있으므로 링크 수만 뽑는다.
  const systemFolderCounts: Record<SystemFolderKey, number> = {
    all: res.systemFolders.all.linkCount,
    uncategorized: res.systemFolders.uncategorized.linkCount,
    favorite: res.systemFolders.favorite.linkCount,
    recentlyDeleted: res.systemFolders.recentlyDeleted.linkCount,
  };

  const myFolders: ArchiveFolder[] = res.folders.map((folder) => ({
    id: String(folder.folderId),
    name: folder.folderName,
    count: folder.linkCount,
    tone: hexToFolderTone(folder.color),
  }));

  return { systemFolderCounts, myFolders };
}

export const folderQueries = {
  keys: folderKeys,
  // 보관함 폴더 목록(시스템 폴더 카운트 + 사용자 폴더).
  list: () =>
    queryOptions({
      queryKey: folderKeys.list(),
      queryFn: async ({ signal }) => {
        const { data } = await apiClient.get<
          SuccessResponse<FolderListResponse>
        >("/folders", { signal });

        return toArchiveFolderData(data.data);
      },
    }),
};

interface CreatedFolder {
  folderId: number;
  folderName: string;
  color: string;
  createdAt: string;
}

/**
 * 폴더 이름 중복 실패인지 판별한다.
 *
 * 409 는 "중복 생성 또는 리소스 상태 충돌" 을 모두 포함하므로 상태 코드로는 단정할 수 없다.
 * 서버 계약(errorCode) 해석은 여기서 하고, 사용자 문구는 화면이 정한다.
 */
export function isDuplicateFolderNameError(error: unknown): boolean {
  return (
    isApiError(error) &&
    error.payload?.error.errorCode === FOLDER_ERROR_CODE.DUPLICATE_NAME
  );
}

// POST /folders — 이름·색상으로 폴더를 생성하고 목록 캐시를 무효화한다.
export function useCreateFolderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ folderName, color }: CreateFolderInput) => {
      const { data } = await apiClient.post<SuccessResponse<CreatedFolder>>(
        "/folders",
        { folderName, color: folderToneToHex(color) },
      );

      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folderKeys.root() });
    },
  });
}
