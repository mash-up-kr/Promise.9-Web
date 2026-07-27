import { zodResolver } from "@hookform/resolvers/zod";
import { isApiError } from "@shared/api";
import { useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";

import { Input, InputField } from "@/components/ui/input/Input";
import { SheetScreen } from "@/components/ui/sheet-screen/SheetScreen";
import { useSnackbar } from "@/components/ui/snackbar/SnackbarProvider";
import { Text } from "@/components/ui/text/Text";

import { useCreateFolderMutation } from "./api/folder.queries";
import { type CreateFolderForm, createFolderSchema } from "./archive.contracts";
import { CreateFolderHeader } from "./components/CreateFolderHeader";
import { FolderColorPicker } from "./components/FolderColorPicker";

export function CreateFolderSheet() {
  const router = useRouter();
  const { show } = useSnackbar();
  const { mutate, isPending } = useCreateFolderMutation();
  const { control, handleSubmit, formState } = useForm<CreateFolderForm>({
    resolver: zodResolver(createFolderSchema),
    mode: "onChange",
    defaultValues: { name: "", color: "blue" },
  });

  const onSave = handleSubmit(({ name, color }) => {
    mutate(
      { folderName: name, color },
      {
        onSuccess: () => router.back(),
        onError: (error) => {
          // 중복 이름(409)만 별도 안내하고, 그 외는 일반 실패 안내한다.
          const message =
            isApiError(error) && error.statusCode === 409
              ? "같은 이름의 폴더가 있어요."
              : "폴더를 만들지 못했어요. 다시 시도해주세요.";
          show({ message });
        },
      },
    );
  });

  return (
    <SheetScreen>
      <CreateFolderHeader
        onCancel={() => router.back()}
        onSave={onSave}
        saveDisabled={!formState.isValid || isPending}
      />

      <View className="gap-2">
        <Text variant="label-1" className="text-text-normal">
          이름
        </Text>
        <Controller
          control={control}
          name="name"
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
    </SheetScreen>
  );
}
