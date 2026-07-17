import { zodResolver } from "@hookform/resolvers/zod";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { Input, InputField, InputSlot } from "@/components/ui/input/Input";
import { SheetScreen } from "@/components/ui/sheet-screen/SheetScreen";
import { useSnackbar } from "@/components/ui/snackbar/SnackbarProvider";
import { Text } from "@/components/ui/text/Text";
import { isWeb } from "@/constants/platform.constants";
import { linkDetailHref } from "@/constants/routes.constants";
import { useCreateLinkMutation } from "@/features/link/api/link.queries";
import { CreateLinkHeader } from "@/features/link/components/CreateLinkHeader";
import { LinkPreviewCard } from "@/features/link/components/LinkPreviewCard";
import { MemoField } from "@/features/link/components/MemoField";
import { RemindQuestionSection } from "@/features/link/components/RemindQuestionSection";
import {
  type CreateLinkForm,
  createLinkSchema,
} from "@/features/link/link.contracts";

export function CreateLinkSheet() {
  const router = useRouter();
  const { show } = useSnackbar();

  const closeSheet = () => {
    // 웹에서 히스토리가 없으면(직접 진입 등) back 이 실패하므로 홈으로 대체한다.
    if (router.canGoBack()) {
      router.back();

      return;
    }
    router.replace("/");
  };

  const { control, handleSubmit, setValue, watch, formState } =
    useForm<CreateLinkForm>({
      resolver: zodResolver(createLinkSchema),
      mode: "onChange",
      defaultValues: {
        url: "",
        remindType: undefined,
        memo: "",
        previewUrl: "",
      },
    });

  const createLinkMutation = useCreateLinkMutation();

  // 클립보드를 자동으로 읽으면 iOS 가 시트를 열 때마다 붙여넣기 권한 팝업을 띄운다.
  // 존재 확인(hasStringAsync)은 팝업이 없으므로 버튼 노출만 결정하고, 실제 읽기는
  // 사용자가 붙여넣기를 눌렀을 때만 한다. 웹은 존재 확인조차 권한 프롬프트를
  // 유발해 버튼을 항상 노출한다.
  const [canPaste, setCanPaste] = useState(isWeb);
  // 프리뷰는 blur/붙여넣기로 확정된 유효 URL 에 대해서만 조회한다(입력 중엔 idle). previewUrl 은 폼 상태.
  const previewUrl = watch("previewUrl") ?? "";

  const commitPreview = (value: string) => {
    const isValid = createLinkSchema.shape.url.safeParse(value).success;
    setValue("previewUrl", isValid ? value : "");
  };

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
          commitPreview(text);
        }
      })
      // 에러 처리 정책 미확정 — 붙여넣기는 부가 기능이라 실패 시 로깅만 하고 넘어간다.
      .catch(console.error);
  };

  const onSave = handleSubmit((values) => {
    // 저장 시트엔 폴더 선택이 없어 folderId 는 항상 null. 실패 시 시트를 열어둔 채
    // 재시도할 수 있게 성공했을 때만 닫는다.
    createLinkMutation.mutate(
      {
        url: values.url,
        folderId: null,
        memo: values.memo?.trim() ? values.memo : null,
        remindType: values.remindType,
      },
      {
        onSuccess: (created) => {
          // 저장 성공 피드백. 시트를 먼저 닫고, 네비게이션이 정착한 다음 프레임에 스낵바를 띄운다
          // — 닫기와 같은 틱에 show 하면 웹에서 스낵바가 렌더되지 않는다.
          closeSheet();
          requestAnimationFrame(() => {
            show({
              message: "링크를 저장했어요",
              action: {
                label: "보기",
                onPress: () =>
                  router.push(linkDetailHref(String(created.linkId))),
              },
            });
          });
        },
      },
    );
  });

  return (
    <SheetScreen onClose={closeSheet}>
      <CreateLinkHeader
        onCancel={closeSheet}
        onSave={onSave}
        saveDisabled={!formState.isValid || createLinkMutation.isPending}
      />

      <LinkPreviewCard url={previewUrl} />

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
              onBlur={() => {
                field.onBlur();
                commitPreview(field.value);
              }}
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
    </SheetScreen>
  );
}
