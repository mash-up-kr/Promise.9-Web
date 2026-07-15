import { zodResolver } from "@hookform/resolvers/zod";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Platform, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BottomSheet } from "@/components/ui/bottom-sheet/BottomSheet";
import { Input, InputField } from "@/components/ui/input/Input";
import { VStack } from "@/components/ui/vstack/VStack";
import { CreateLinkHeader } from "@/features/link/components/CreateLinkHeader";
import { MemoField } from "@/features/link/components/MemoField";
import { RemindQuestionSection } from "@/features/link/components/RemindQuestionSection";
import {
  type CreateLinkForm,
  createLinkSchema,
} from "@/features/link/link.contracts";

export function CreateLinkSheet() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { control, handleSubmit, setValue, formState } =
    useForm<CreateLinkForm>({
      resolver: zodResolver(createLinkSchema),
      mode: "onChange",
      defaultValues: { url: "", remindType: undefined, memo: "" },
    });

  // biome-ignore lint/correctness/useExhaustiveDependencies: 최초 진입 시 1회만 클립보드를 검사한다. setValue 는 react-hook-form 이 보장하는 안정 참조.
  useEffect(function prefillUrlFromClipboard() {
    let active = true;
    Clipboard.getStringAsync().then((text) => {
      if (
        active &&
        text &&
        createLinkSchema.shape.url.safeParse(text).success
      ) {
        setValue("url", text, { shouldValidate: true });
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const onSave = handleSubmit(() => {
    // TODO(#33): 실제 저장 API 연동 지점. 지금은 mock — 폼 유효 시 시트만 닫는다.
    router.back();
  });

  const content = (
    <KeyboardAwareScrollView
      bottomOffset={24}
      keyboardShouldPersistTaps="handled"
    >
      <VStack space="2xl" className="pt-1">
        <CreateLinkHeader
          onCancel={() => router.back()}
          onSave={onSave}
          saveDisabled={!formState.isValid}
        />

        <Controller
          control={control}
          name="url"
          render={({ field }) => (
            <Input variant="field">
              <InputField
                placeholder="URL"
                autoCapitalize="none"
                keyboardType="url"
                value={field.value}
                onChangeText={field.onChange}
              />
            </Input>
          )}
        />

        <Controller
          control={control}
          name="remindType"
          render={({ field }) => (
            <RemindQuestionSection
              value={field.value ?? null}
              onChange={field.onChange}
            />
          )}
        />

        <Controller
          control={control}
          name="memo"
          render={({ field }) => (
            <MemoField memo={field.value ?? ""} onChangeMemo={field.onChange} />
          )}
        />
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
