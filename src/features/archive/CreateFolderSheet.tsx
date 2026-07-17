import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";

import { Input, InputField } from "@/components/ui/input/Input";
import { SheetScreen } from "@/components/ui/sheet-screen/SheetScreen";
import { Text } from "@/components/ui/text/Text";

import { type CreateFolderForm, createFolderSchema } from "./archive.contracts";
import { CreateFolderHeader } from "./components/CreateFolderHeader";
import { FolderColorPicker } from "./components/FolderColorPicker";

export function CreateFolderSheet() {
  const router = useRouter();
  const { control, handleSubmit, formState } = useForm<CreateFolderForm>({
    resolver: zodResolver(createFolderSchema),
    mode: "onChange",
    defaultValues: { name: "", color: "blue" },
  });

  const onSave = handleSubmit(() => {
    // TODO(#37): 폴더 생성 API 연동 지점. 지금은 mock — 유효 시 시트만 닫는다.
    router.back();
  });

  return (
    <SheetScreen>
      <CreateFolderHeader
        onCancel={() => router.back()}
        onSave={onSave}
        saveDisabled={!formState.isValid}
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
