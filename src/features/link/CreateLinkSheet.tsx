import { zodResolver } from "@hookform/resolvers/zod";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BottomSheet } from "@/components/ui/bottom-sheet/BottomSheet";
import { Input, InputField, InputSlot } from "@/components/ui/input/Input";
import { Text } from "@/components/ui/text/Text";
import { VStack } from "@/components/ui/vstack/VStack";
import { isWeb } from "@/constants/platform.constants";
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

  // 클립보드를 자동으로 읽으면 iOS 가 시트를 열 때마다 붙여넣기 권한 팝업을 띄운다.
  // 존재 확인(hasStringAsync)은 팝업이 없으므로 버튼 노출만 결정하고, 실제 읽기는
  // 사용자가 붙여넣기를 눌렀을 때만 한다. 웹은 존재 확인조차 권한 프롬프트를
  // 유발해 버튼을 항상 노출한다.
  const [canPaste, setCanPaste] = useState(isWeb);

  useEffect(function checkClipboardHasText() {
    if (isWeb) return;
    let active = true;
    Clipboard.hasStringAsync()
      .then((hasString) => {
        if (active) setCanPaste(hasString);
      })
      .catch(console.error);
    return () => {
      active = false;
    };
  }, []);

  const handlePasteUrl = () => {
    Clipboard.getStringAsync()
      .then((text) => {
        if (text && createLinkSchema.shape.url.safeParse(text).success) {
          setValue("url", text, { shouldValidate: true });
        }
      })
      // 에러 처리 정책 미확정 — 붙여넣기는 부가 기능이라 실패 시 로깅만 하고 넘어간다.
      .catch(console.error);
  };

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
              {canPaste && !field.value && (
                <InputSlot
                  accessibilityRole="button"
                  onPress={handlePasteUrl}
                  className="pl-3"
                >
                  <Text variant="body-2-normal" className="text-icon-accent">
                    붙여넣기
                  </Text>
                </InputSlot>
              )}
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

  if (isWeb) {
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
