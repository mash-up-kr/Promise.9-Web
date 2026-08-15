import type { SelectableFolderColor } from "@shared/folder/folder.constants";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";

import { useSnackbar } from "@/components/ui/snackbar/SnackbarProvider";
import { useUpdateFolderMutation } from "./api/folder.queries";
import { FOLDER_COLOR_OPTIONS } from "./archive.constants";
import { DuplicateFolderNameAlert } from "./components/DuplicateFolderNameAlert";
import { FolderFormSheet } from "./components/FolderFormSheet";
import { isDuplicateFolderNameError } from "./folder.errors";

/** 팔레트 밖 값(기본색 등)으로 편집을 시작하면 폼이 검증에 걸리므로 선택 가능한 색으로 맞춘다. */
function toSelectableColor(color?: string): SelectableFolderColor {
  return FOLDER_COLOR_OPTIONS.includes(color as SelectableFolderColor)
    ? (color as SelectableFolderColor)
    : "blue";
}

export function EditFolderSheet() {
  const router = useRouter();
  const { show } = useSnackbar();
  const { mutate, isPending } = useUpdateFolderMutation();
  const [isDuplicateOpen, setIsDuplicateOpen] = useState(false);
  // 목록에서 이미 가진 값이라 상세를 다시 조회하지 않고 params 로 받는다.
  const { id, name, color } = useLocalSearchParams<{
    id: string;
    name: string;
    color?: string;
  }>();

  return (
    <>
      <FolderFormSheet
        title="폴더 편집"
        defaultValues={{
          folderName: name ?? "",
          color: toSelectableColor(color),
        }}
        isSubmitting={isPending}
        onCancel={() => router.back()}
        onSubmit={(values, dirtyFields) =>
          mutate(
            {
              folderId: id,
              folderName: values.folderName,
              // 색을 고르지 않았으면 보내지 않는다 — 팔레트 밖 색으로 들어온 폴더는
              // 폼에 폴백 색이 잡혀 있어, 그대로 보내면 이름만 고쳐도 색이 덮인다.
              color: dirtyFields.color ? values.color : undefined,
            },
            {
              onSuccess: () => router.back(),
              onError: (error) => {
                // 중복 이름은 고쳐 쓸 수 있게 다이얼로그로 잡아두고, 그 외는 스낵바로 알린다.
                if (isDuplicateFolderNameError(error)) {
                  setIsDuplicateOpen(true);
                  return;
                }
                show({
                  message: "폴더를 수정하지 못했어요. 다시 시도해주세요.",
                });
              },
            },
          )
        }
      />
      <DuplicateFolderNameAlert
        isOpen={isDuplicateOpen}
        onClose={() => setIsDuplicateOpen(false)}
      />
    </>
  );
}
