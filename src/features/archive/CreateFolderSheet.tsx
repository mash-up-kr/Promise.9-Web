import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { Platform, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BottomSheet } from "@/components/ui/bottom-sheet/BottomSheet";
import { Input, InputField } from "@/components/ui/input/Input";
import { Text } from "@/components/ui/text/Text";
import { VStack } from "@/components/ui/vstack/VStack";

import { type CreateFolderForm, createFolderSchema } from "./archive.contracts";
import { CreateFolderHeader } from "./components/CreateFolderHeader";
import { FolderColorPicker } from "./components/FolderColorPicker";

export function CreateFolderSheet() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { control, handleSubmit, formState } = useForm<CreateFolderForm>({
    resolver: zodResolver(createFolderSchema),
    mode: "onChange",
    defaultValues: { name: "", color: "blue" },
  });

  const onSave = handleSubmit(() => {
    // TODO(#37): 폴더 생성 API 연동 지점. 지금은 mock — 유효 시 시트만 닫는다.
    router.back();
  });

  const content = (
    <KeyboardAwareScrollView
      bottomOffset={24}
      keyboardShouldPersistTaps="handled"
    >
      <VStack space="2xl" className="pt-1">
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
              <FolderColorPicker
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </View>
      </VStack>
    </KeyboardAwareScrollView>
  );

  if (Platform.OS === "web") {
    return <BottomSheet onClose={() => router.back()}>{content}</BottomSheet>;
  }

  return (
    <View
      className="flex-1 bg-background-base px-5"
      style={{ paddingBottom: insets.bottom + 16 }}
    >
      {content}
    </View>
  );
}
