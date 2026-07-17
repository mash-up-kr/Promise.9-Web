import { zodResolver } from "@hookform/resolvers/zod";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

import { Input, InputField } from "@/components/ui/input/Input";
import { SheetScreen } from "@/components/ui/sheet-screen/SheetScreen";
import { CreateLinkHeader } from "@/features/link/components/CreateLinkHeader";
import { MemoField } from "@/features/link/components/MemoField";
import { RemindQuestionSection } from "@/features/link/components/RemindQuestionSection";
import {
  type CreateLinkForm,
  createLinkSchema,
} from "@/features/link/link.contracts";

export function CreateLinkSheet() {
  const router = useRouter();
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

  return (
    <SheetScreen>
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
    </SheetScreen>
  );
}
