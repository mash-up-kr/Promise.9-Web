import {
  useCreateFolderMutation,
  useUpdateFolderMutation,
} from "@shared/entities/folder/folder.queries";
import type { SelectableFolderColor } from "@shared/folder/folder.constants";
import { FOLDER_COLOR_OPTIONS } from "@shared/folder/folder.constants";
import { useLocalSearchParams, useRouter } from "expo-router";

import { useSnackbar } from "@/components/ui/snackbar/SnackbarProvider";

import { FolderFormCard } from "./components/FolderFormCard";

export type FolderFormMode = "create" | "edit";

export interface FolderFormSheetProps {
  mode: FolderFormMode;
}

/**
 * 폴더 이름·색상 입력 모달 (Figma "Folder Edit Modal").
 *
 * 바텀시트가 아니라 화면 중앙 카드다 — 라우트 자체가 transparentModal 이라 여기서는
 * dim 배경과 가운데 카드만 그린다. 생성·편집이 같은 폼이라 라우트는 `mode` 만 넘기고,
 * 초기값·요청·문구는 이 모듈이 안에서 정한다.
 */
export function FolderFormSheet({ mode }: FolderFormSheetProps) {
  // 모드마다 초기값·요청·문구가 전부 다르다. 분기를 여기서 한 번에 끝내야
  // 삼항이 흩어지지 않고, 편집에만 있는 라우트 파라미터도 그쪽에 갇힌다.
  return mode === "create" ? <CreateFolderForm /> : <EditFolderForm />;
}

function CreateFolderForm() {
  const router = useRouter();
  const { show } = useSnackbar();
  const { mutateAsync } = useCreateFolderMutation();

  return (
    <FolderFormCard
      title="새 폴더 만들기"
      defaultValues={{ folderName: "", color: "blue" }}
      onSubmit={(values) => mutateAsync(values)}
      onClose={() => router.back()}
      onError={() =>
        show({ message: "폴더를 만들지 못했어요. 다시 시도해주세요." })
      }
    />
  );
}

function EditFolderForm() {
  const router = useRouter();
  const { show } = useSnackbar();
  const { mutateAsync } = useUpdateFolderMutation();
  // 목록에서 이미 가진 값이라 상세를 다시 조회하지 않고 params 로 받는다.
  const { id, name, color } = useLocalSearchParams<{
    id: string;
    name: string;
    color?: string;
  }>();

  return (
    <FolderFormCard
      title="폴더 편집"
      defaultValues={{
        folderName: name ?? "",
        color: toSelectableColor(color),
      }}
      onSubmit={(values, dirtyFields) =>
        mutateAsync({
          folderId: id,
          folderName: values.folderName,
          // 색을 고르지 않았으면 보내지 않는다 — 팔레트 밖 색으로 들어온 폴더는
          // 폼에 폴백 색이 잡혀 있어, 그대로 보내면 이름만 고쳐도 색이 덮인다.
          color: dirtyFields.color ? values.color : undefined,
        })
      }
      onClose={() => router.back()}
      onError={() =>
        show({ message: "폴더를 수정하지 못했어요. 다시 시도해주세요." })
      }
    />
  );
}

/** 팔레트 밖 값(기본색 등)으로 편집을 시작하면 폼이 검증에 걸리므로 선택 가능한 색으로 맞춘다. */
function toSelectableColor(color?: string): SelectableFolderColor {
  return FOLDER_COLOR_OPTIONS.includes(color as SelectableFolderColor)
    ? (color as SelectableFolderColor)
    : "blue";
}
