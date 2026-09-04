import { zodResolver } from "@hookform/resolvers/zod";
import { isAlreadySavedLinkError } from "@shared/entities/link/link.errors";
import { useCreateLinkMutation } from "@shared/entities/link/link.queries";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  type Control,
  Controller,
  type UseFormSetValue,
  useForm,
  useWatch,
} from "react-hook-form";
import { View } from "react-native";

import { AsyncBoundary } from "@/components/ui/async-boundary/AsyncBoundary";
import { BottomSheetHeader } from "@/components/ui/bottom-sheet/BottomSheetHeader";
import { useSheetDismiss } from "@/components/ui/bottom-sheet/useSheetDismiss";
import { Input, InputField, InputSlot } from "@/components/ui/input/Input";
import { SheetScreen } from "@/components/ui/sheet-screen/SheetScreen";
import { useSnackbar } from "@/components/ui/snackbar/SnackbarProvider";
import { snackbarPresets } from "@/components/ui/snackbar/snackbar.presets";
import { Text } from "@/components/ui/text/Text";
import { isWeb } from "@/constants/platform.constants";
import { linkDetailHref } from "@/constants/routes.constants";
import { FolderChipList } from "@/features/link/components/FolderChipList";
import { LinkPreviewCard } from "@/features/link/components/LinkPreviewCard";
import { MemoField } from "@/features/link/components/MemoField";
import { ReminderSection } from "@/features/link/components/ReminderSection";
import {
  type CreateLinkForm,
  createLinkSchema,
  linkUrlSchema,
} from "@/features/link/link.contracts";
import {
  isPastReminder,
  toReminderAtIso,
} from "@/features/link/reminder.utils";

// 시안: 저장 완료·중복 스낵바는 자동 dismiss 를 4초 뒤로 늦춘다(Snackbar 기본 2.5초와 다르다).
const SAVE_SNACKBAR_DURATION = 4000;

export function CreateLinkSheet() {
  const router = useRouter();
  const { show } = useSnackbar();
  const { control, handleSubmit, setValue } = useForm<CreateLinkForm>({
    resolver: zodResolver(createLinkSchema),
    mode: "onChange",
    defaultValues: {
      url: "",
      folderId: null,
      reminder: null,
      memo: "",
      previewUrl: "",
    },
  });
  const createLinkMutation = useCreateLinkMutation();
  // watch() 는 안정 참조 prop 경유 시 React Compiler 메모이제이션에 갱신이 막힌다 —
  // useWatch 는 구독 컴포넌트 자체 상태로 리렌더를 트리거해 컴파일러와 안전하다.
  const url = useWatch({ control, name: "url" });
  const isSaving = createLinkMutation.isPending;

  const closeSheet = () => {
    // 웹에서 히스토리가 없으면(직접 진입 등) back 이 실패하므로 홈으로 대체한다.
    if (router.canGoBack()) {
      router.back();

      return;
    }
    router.replace("/");
  };

  // dismiss 는 gorhom 컨텍스트 안(헤더)에서만 얻을 수 있어 헤더가 이 핸들러에 주입한다.
  const save = (dismiss: () => void) =>
    handleSubmit((values) => {
      const parsedUrl = linkUrlSchema.safeParse(values.url);
      if (!parsedUrl.success) {
        // 시안 정책: 형식 오류도 저장 실패와 동일 UX — 서버 왕복 없이 실패 스낵바.
        show(snackbarPresets.failed("저장하지 못했어요", () => save(dismiss)));
        return;
      }
      if (values.reminder && isPastReminder(values.reminder)) {
        show({
          message: "선택한 시간이 이미 지났어요. 날짜나 시간을 변경해 주세요",
        });
        return;
      }
      createLinkMutation.mutate(
        {
          url: values.url,
          folderId: values.folderId,
          memo: values.memo?.trim() || null,
          reminderAt: values.reminder ? toReminderAtIso(values.reminder) : null,
        },
        {
          onSuccess: (created) => {
            show({
              ...snackbarPresets.success("링크를 저장했어요", () =>
                router.push(linkDetailHref(String(created.linkId))),
              ),
              duration: SAVE_SNACKBAR_DURATION,
            });
            dismiss();
          },
          onError: (error) => {
            if (isAlreadySavedLinkError(error)) {
              // 409 응답에 기존 linkId 가 없어 '보기' 액션은 서버 보강 후 붙인다(스펙 결정).
              show({
                ...snackbarPresets.duplicate("이미 저장된 링크예요"),
                duration: SAVE_SNACKBAR_DURATION,
              });
              return;
            }
            show(
              snackbarPresets.failed("저장하지 못했어요", () => save(dismiss)),
            );
          },
        },
      );
    })();

  return (
    <SheetScreen
      onClose={closeSheet}
      backdropPressBehavior="none"
      isLocked={isSaving}
      header={
        <CreateLinkSheetHeader
          isConfirmDisabled={url.trim().length === 0}
          isConfirmPending={isSaving}
          onSave={save}
        />
      }
    >
      <View pointerEvents={isSaving ? "none" : "auto"} className="gap-6">
        <UrlPreviewField control={control} setValue={setValue} />
        <AsyncBoundary pending={null} fallback={null}>
          <Controller
            control={control}
            name="folderId"
            render={({ field }) => (
              <FolderChipList value={field.value} onChange={field.onChange} />
            )}
          />
        </AsyncBoundary>
        <Controller
          control={control}
          name="reminder"
          render={({ field }) => (
            <ReminderSection value={field.value} onChange={field.onChange} />
          )}
        />
        <Controller
          control={control}
          name="memo"
          render={({ field }) => (
            <MemoField memo={field.value ?? ""} onChangeMemo={field.onChange} />
          )}
        />
      </View>
    </SheetScreen>
  );
}

interface CreateLinkSheetHeaderProps {
  isConfirmDisabled: boolean;
  isConfirmPending: boolean;
  onSave: (dismiss: () => void) => void;
}

// header prop 을 통해 렌더되지만 SheetShell 이 gorhom BottomSheet 안에 그리므로
// useSheetDismiss 를 여기서 얻어 취소·저장 핸들러에 연결할 수 있다.
function CreateLinkSheetHeader({
  isConfirmDisabled,
  isConfirmPending,
  onSave,
}: CreateLinkSheetHeaderProps) {
  const dismiss = useSheetDismiss();

  return (
    <View
      pointerEvents={isConfirmPending ? "none" : "auto"}
      className="bg-gray-900"
    >
      <BottomSheetHeader
        title="링크 저장"
        onCancel={dismiss}
        onConfirm={() => onSave(dismiss)}
        isConfirmDisabled={isConfirmDisabled}
        isConfirmPending={isConfirmPending}
      />
    </View>
  );
}

interface UrlPreviewFieldProps {
  control: Control<CreateLinkForm>;
  setValue: UseFormSetValue<CreateLinkForm>;
}

// 시안 통합 카드: previewUrl 이 있으면 LinkPreviewCard(셸 없이) + URL 입력을 하나의 라운드
// 컨테이너로 합치고(frame-skeleton/save-success), 없으면 URL 입력 하나만 보인다(frame-empty).
function UrlPreviewField({ control, setValue }: UrlPreviewFieldProps) {
  // 클립보드를 자동으로 읽으면 iOS 가 시트를 열 때마다 붙여넣기 권한 팝업을 띄운다.
  // 존재 확인(hasStringAsync)은 팝업이 없으므로 버튼 노출만 결정하고, 실제 읽기는
  // 사용자가 붙여넣기를 눌렀을 때만 한다. 웹은 존재 확인조차 권한 프롬프트를
  // 유발해 버튼을 항상 노출한다.
  const [canPaste, setCanPaste] = useState(isWeb);
  // 프리뷰는 blur/붙여넣기로 확정된 유효 URL 에 대해서만 조회한다(입력 중엔 idle). previewUrl 은 폼 상태.
  // watch() 는 React Compiler 메모이제이션에 갱신이 막혀 useWatch 로 구독한다.
  const previewUrl = useWatch({ control, name: "previewUrl" }) ?? "";
  const hasPreview = previewUrl.length > 0;

  const commitPreview = (value: string) => {
    const isValid = linkUrlSchema.safeParse(value).success;
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
        if (text && linkUrlSchema.safeParse(text).success) {
          setValue("url", text, { shouldValidate: true });
          commitPreview(text);
        }
      })
      // 에러 처리 정책 미확정 — 붙여넣기는 부가 기능이라 실패 시 로깅만 하고 넘어간다.
      .catch(console.error);
  };

  const urlField = (
    <Controller
      control={control}
      name="url"
      render={({ field }) => (
        <>
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
              <Text variant="label-2-semibold" className="text-action-inverse">
                붙여넣기
              </Text>
            </InputSlot>
          )}
        </>
      )}
    />
  );

  if (!hasPreview) {
    return <Input variant="field">{urlField}</Input>;
  }

  return (
    <View className="w-full rounded-[20px] bg-opacity-white-10">
      <View className="px-4 pt-4">
        <LinkPreviewCard url={previewUrl} isBare />
        <View className="mt-4 h-px w-full bg-opacity-white-10" />
      </View>
      <View className="h-13 flex-row items-center px-4">{urlField}</View>
    </View>
  );
}
