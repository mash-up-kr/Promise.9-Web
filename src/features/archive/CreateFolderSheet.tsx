import { useRouter } from "expo-router";
import { useState } from "react";

import { useSnackbar } from "@/components/ui/snackbar/SnackbarProvider";
import { useCreateFolderMutation } from "./api/folder.queries";
import { DuplicateFolderNameAlert } from "./components/DuplicateFolderNameAlert";
import { FolderFormSheet } from "./components/FolderFormSheet";
import { isDuplicateFolderNameError } from "./folder.errors";

export function CreateFolderSheet() {
  const router = useRouter();
  const { show } = useSnackbar();
  const { mutate, isPending } = useCreateFolderMutation();
  const [isDuplicateOpen, setIsDuplicateOpen] = useState(false);

  return (
    <>
      <FolderFormSheet
        title="새 폴더 만들기"
        defaultValues={{ folderName: "", color: "blue" }}
        isSubmitting={isPending}
        onCancel={() => router.back()}
        onSubmit={(values) =>
          mutate(values, {
            onSuccess: () => router.back(),
            onError: (error) => {
              // 중복 이름은 고쳐 쓸 수 있게 다이얼로그로 잡아두고, 그 외는 스낵바로 알린다.
              if (isDuplicateFolderNameError(error)) {
                setIsDuplicateOpen(true);
                return;
              }
              show({ message: "폴더를 만들지 못했어요. 다시 시도해주세요." });
            },
          })
        }
      />
      <DuplicateFolderNameAlert
        isOpen={isDuplicateOpen}
        onClose={() => setIsDuplicateOpen(false)}
      />
    </>
  );
}
