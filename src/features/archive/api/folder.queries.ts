import { apiClient, isApiError, type SuccessResponse } from "@shared/api";
import {
  folderToneToHex,
  hexToFolderTone,
  type MappedFolderTone,
} from "@shared/folder/folder.colors";
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { FOLDER_ERROR_CODE, SYSTEM_FOLDERS } from "../archive.constants";
import type { ArchiveFolder, ArchiveFolderData } from "../archive.types";

interface SystemFolderCount {
  linkCount: number;
}

type SystemFolderKey = (typeof SYSTEM_FOLDERS)[number]["countKey"];

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
  const systemFolders: ArchiveFolder[] = SYSTEM_FOLDERS.map((folder) => ({
    id: folder.id,
    name: folder.name,
    count: res.systemFolders[folder.countKey].linkCount,
    tone: "gray",
  }));

  const myFolders: ArchiveFolder[] = res.folders.map((folder) => ({
    id: String(folder.folderId),
    name: folder.folderName,
    count: folder.linkCount,
    tone: hexToFolderTone(folder.color),
  }));

  return { systemFolders, myFolders };
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

export interface CreateFolderPayload {
  folderName: string;
  // UI tone — 전송 시 서버 팔레트 hex 로 변환한다.
  color: MappedFolderTone;
}

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
    mutationFn: async ({ folderName, color }: CreateFolderPayload) => {
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
