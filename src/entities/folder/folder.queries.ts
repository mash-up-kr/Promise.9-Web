import { apiClient, type SuccessResponse } from "@shared/api";
import {
  folderToneToHex,
  type SelectableFolderColor,
} from "@shared/folder/folder.constants";
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { z } from "zod";

import { linkKeys } from "@/entities/link/link.keys";

import { isFolderOrderMismatchError } from "./folder.errors";
import { folderKeys } from "./folder.keys";

const systemFolderCountSchema = z.looseObject({ linkCount: z.number() });

const folderListItemSchema = z.looseObject({
  folderId: z.number(),
  folderName: z.string(),
  // 서버 팔레트 hex. 팔레트 밖 값·기본색은 hexToFolderTone 이 gray 로 폴백한다.
  color: z.string(),
  linkCount: z.number(),
  // 폴더 내 링크를 5초 이상 조회한 누적 횟수. 서버 feature/folder-view-count 머지 전까지는 응답에 없다.
  viewCount: z.number().optional(),
  lastSavedAt: z.string().nullable(),
});

/**
 * GET /folders 응답 스키마.
 *
 * looseObject 라 모르는 키는 버리지 않고 통과시킨다 — 서버가 필드를 추가해도 깨지지 않고,
 * 캐시에 원본이 남아 그 필드를 쓸 때 스키마만 넓히면 된다(strip 이면 이미 지워져 재요청해야 한다).
 * 기본 폴더가 늘었는데 스키마를 안 넓히면 소비 측 select 가 컴파일에서 잡는다.
 */
export const folderListResponseSchema = z.looseObject({
  systemFolders: z.looseObject({
    all: systemFolderCountSchema,
    uncategorized: systemFolderCountSchema,
    favorite: systemFolderCountSchema,
    recentlyDeleted: systemFolderCountSchema,
  }),
  folders: z.array(folderListItemSchema),
});

export type FolderListResponse = z.infer<typeof folderListResponseSchema>;

export const folderQueries = {
  keys: folderKeys,
  /**
   * GET /folders — 시스템 폴더 카운트 + 사용자 폴더.
   *
   * 캐시에는 검증된 서버 응답을 그대로 두고 화면별 모델 변환은 소비 측 `select` 가 맡는다.
   * 보관함과 홈이 같은 캐시를 쓰면서 서로 다른 모델을 뽑아 쓴다.
   */
  list: () =>
    queryOptions({
      queryKey: folderKeys.list(),
      queryFn: async ({ signal }) => {
        const { data } = await apiClient.get<SuccessResponse<unknown>>(
          "/folders",
          { signal },
        );

        return folderListResponseSchema.parse(data.data);
      },
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

export interface CreateFolderVariables {
  folderName: string;
  /** 팔레트 tone. 전송 시 hex 로 변환한다. */
  color: SelectableFolderColor;
}

/** 화면이 들고 있는 폴더 id 순서를 PUT /folders/order 요청 본문으로 변환한다. */
export function toReorderRequest(orderedIds: readonly string[]): {
  folderIds: number[];
} {
  return { folderIds: orderedIds.map(Number) };
}

// PUT /folders/order — 최종 순서 전체를 저장하고 목록 캐시를 무효화한다.
// 서버가 이 순서를 GET /folders 에 반영하므로 성공 후엔 재조회 결과가 곧 정답이다.
export function useReorderFoldersMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderedIds: readonly string[]) => {
      await apiClient.put("/folders/order", toReorderRequest(orderedIds));
    },
    // 재조회 promise 를 반환해 그게 끝나야 mutation 이 끝나게 한다 — 화면이 로컬 순서를
    // 버리는 시점이 새 목록 도착보다 빠르면 옛 순서로 되돌아갔다 다시 튄다.
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: folderKeys.root() }),
    // 목록이 서버와 어긋나서 실패한 경우엔 화면이 들고 있는 목록 자체가 낡았다.
    // 재조회하지 않으면 같은 목록으로 다시 저장해도 계속 같은 실패가 난다.
    onError: (error) => {
      if (isFolderOrderMismatchError(error)) {
        queryClient.invalidateQueries({ queryKey: folderKeys.root() });
      }
    },
  });
}

// POST /folders — 이름·색상으로 폴더를 생성하고 목록 캐시를 무효화한다.
export function useCreateFolderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ folderName, color }: CreateFolderVariables) => {
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

export interface UpdateFolderVariables {
  folderId: string;
  folderName: string;
  /**
   * 바꾸지 않았으면 생략한다. 팔레트 밖 색(기본색 등)은 편집 폼에서 폴백 색으로 보이므로,
   * 늘 보내면 이름만 고쳐도 그 폴백 색으로 덮어쓰게 된다.
   */
  color?: SelectableFolderColor;
}

// PATCH /folders/{folderId} — 이름·색상을 수정하고 목록 캐시를 무효화한다.
// 서버 문서에는 folderName 만 적혀 있으나 구현(updateFolderSchema)은 color 도 받는다.
export function useUpdateFolderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      folderId,
      folderName,
      color,
    }: UpdateFolderVariables) => {
      await apiClient.patch(`/folders/${folderId}`, {
        folderName,
        ...(color && { color: folderToneToHex(color) }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folderKeys.root() });
    },
  });
}

// DELETE /folders/{folderId} — 폴더를 삭제하고 목록 캐시를 무효화한다.
// 폴더에 있던 링크는 서버가 미분류로 옮기므로 링크 목록 캐시도 함께 버린다.
export function useDeleteFolderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (folderId: string) => {
      await apiClient.delete(`/folders/${folderId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folderKeys.root() });
      queryClient.invalidateQueries({ queryKey: linkKeys.lists() });
    },
  });
}
