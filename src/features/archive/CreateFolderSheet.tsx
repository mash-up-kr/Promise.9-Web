import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";

import { BottomSheetHeader } from "@/components/ui/bottom-sheet/BottomSheetHeader";
import { useSheetDismiss } from "@/components/ui/bottom-sheet/useSheetDismiss";
import { Input, InputField } from "@/components/ui/input/Input";
import { SheetScreen } from "@/components/ui/sheet-screen/SheetScreen";
import { useSnackbar } from "@/components/ui/snackbar/SnackbarProvider";
import { Text } from "@/components/ui/text/Text";

import {
  isDuplicateFolderNameError,
  useCreateFolderMutation,
} from "./api/folder.queries";
import {
  type CreateFolderInput,
  createFolderSchema,
} from "./archive.contracts";
import { FolderColorPicker } from "./components/FolderColorPicker";

export function CreateFolderSheet() {
  return (
    <SheetScreen>
      <CreateFolderSheetBody />
    </SheetScreen>
  );
}

// 취소·저장 성공 시 라우트를 바로 제거하지 않고 시트 닫힘 애니메이션을 거친다
// (useSheetDismiss 는 시트 자손에서만 쓸 수 있어 본문을 분리).
function CreateFolderSheetBody() {
  const dismiss = useSheetDismiss();
  const { show } = useSnackbar();
  const { mutate, isPending } = useCreateFolderMutation();
  const { control, handleSubmit, formState } = useForm<CreateFolderInput>({
    resolver: zodResolver(createFolderSchema),
    mode: "onChange",
    defaultValues: { folderName: "", color: "blue" },
  });

  const onSave = handleSubmit((values) => {
    mutate(values, {
      onSuccess: () => dismiss(),
      onError: (error) => {
        // 중복 이름만 별도 안내하고, 그 외는 일반 실패 안내한다.
        const message = isDuplicateFolderNameError(error)
          ? "같은 이름의 폴더가 있어요."
          : "폴더를 만들지 못했어요. 다시 시도해주세요.";
        show({ message });
      },
    });
  });

  return (
    <>
      <BottomSheetHeader
        title="새 폴더 만들기"
        onCancel={dismiss}
        onConfirm={onSave}
        isConfirmDisabled={!formState.isValid || isPending}
      />

      <View className="gap-2">
        <Text variant="label-1" className="text-text-normal">
          이름
        </Text>
        <Controller
          control={control}
          name="folderName"
          render={({ field }) => (
            <Input variant="field">
              <InputField
                placeholder="폴더 이름을 입력하세요."
                value={field.value}
                onChangeText={field.onChange}
              />
            </Input>
          )}
        />
      </View>

      <View className="gap-4">
        <Text variant="label-1" className="text-text-normal">
          색상
        </Text>
        <Controller
          control={control}
          name="color"
          render={({ field }) => (
            <FolderColorPicker value={field.value} onChange={field.onChange} />
          )}
        />
      </View>
    </>
  );
}
