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
import { z } from "zod";

import { FOLDER_ERROR_CODE } from "../archive.constants";
import type { CreateFolderInput } from "../archive.contracts";
import type {
  ArchiveFolder,
  ArchiveFolderData,
  SystemFolderKey,
} from "../archive.types";

const systemFolderCountSchema = z.object({ linkCount: z.number() });

const folderListItemSchema = z.object({
  folderId: z.number(),
  folderName: z.string(),
  // 서버 팔레트 hex. 팔레트 밖 값·기본색은 hexToFolderTone 이 gray 로 폴백한다.
  color: z.string(),
  linkCount: z.number(),
  lastSavedAt: z.string().nullable(),
});

/**
 * GET /folders 응답 스키마.
 *
 * 모르는 키는 zod 기본 동작대로 버려 서버가 필드를 추가해도 깨지지 않는다.
 * 기본 폴더가 늘었는데 스키마를 안 넓히면 toArchiveFolderData 가 컴파일에서 잡는다.
 */
export const folderListResponseSchema = z.object({
  systemFolders: z.object({
    all: systemFolderCountSchema,
    uncategorized: systemFolderCountSchema,
    favorite: systemFolderCountSchema,
    recentlyDeleted: systemFolderCountSchema,
  }),
  folders: z.array(folderListItemSchema),
});

type FolderListResponse = z.infer<typeof folderListResponseSchema>;

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
      // 캐시에는 검증된 서버 응답을 그대로 두고, UI 모델 변환은 select 가 맡는다.
      // toArchiveFolderData 는 모듈 스코프 함수라 참조가 안정적이어서 불필요한 재계산이 없다.
      queryFn: async ({ signal }) => {
        const { data } = await apiClient.get<SuccessResponse<unknown>>(
          "/folders",
          { signal },
        );

        return folderListResponseSchema.parse(data.data);
      },
      select: toArchiveFolderData,
    }),
};

/**
 * POST /folders 응답.
 *
 * 조회 응답과 달리 zod 로 검증하지 않는다 — 값을 쓰는 곳이 없는데 검증에서 던지면
 * 폴더는 만들어진 채로 화면엔 생성 실패로 보이기 때문. 서버 문서에도 `color` 가 없어
 * 실제 shape 이 확정되지 않았다(Swagger 확인 필요).
 */
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
