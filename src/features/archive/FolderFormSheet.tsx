import { zodResolver } from "@hookform/resolvers/zod";
import { isDuplicateFolderNameError } from "@shared/entities/folder/folder.errors";
import {
  useCreateFolderMutation,
  useUpdateFolderMutation,
} from "@shared/entities/folder/folder.queries";
import type { SelectableFolderColor } from "@shared/folder/folder.constants";
import { FOLDER_COLOR_OPTIONS } from "@shared/folder/folder.constants";
import {
  type CreateFolderInput,
  createFolderSchema,
} from "@shared/folder/folder.contracts";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";
import { ActionButton } from "@/components/ui/action-button/ActionButton";
import { Dialog } from "@/components/ui/dialog/Dialog";

import { Input, InputField } from "@/components/ui/input/Input";
import { useSnackbar } from "@/components/ui/snackbar/SnackbarProvider";
import { Text } from "@/components/ui/text/Text";

import { DuplicateFolderNameAlert } from "./components/DuplicateFolderNameAlert";
import { FolderColorPicker } from "./components/FolderColorPicker";

export type FolderFormMode = "create" | "edit";

export interface FolderFormSheetProps {
  mode: FolderFormMode;
}

/**
 * 폴더 이름·색상 입력 모달 (Figma "Folder Edit Modal").
 *
 * 바텀시트가 아니라 화면 중앙 카드다 — 라우트 자체가 transparentModal 이라 여기서는
 * dim 배경과 가운데 카드만 그린다. 생성·편집이 같은 폼이라 라우트는 `mode` 만 넘기고,
 * 초기값·요청·문구는 이 모듈이 안에서 정한다.
 */
export function FolderFormSheet({ mode }: FolderFormSheetProps) {
  // 모드마다 초기값·요청·문구가 전부 다르다. 분기를 여기서 한 번에 끝내야
  // 삼항이 흩어지지 않고, 편집에만 있는 라우트 파라미터도 그쪽에 갇힌다.
  return mode === "create" ? <CreateFolderForm /> : <EditFolderForm />;
}

function CreateFolderForm() {
  const { mutateAsync } = useCreateFolderMutation();

  return (
    <FolderFormCard
      title="새 폴더 만들기"
      defaultValues={{ folderName: "", color: "blue" }}
      failureMessage="폴더를 만들지 못했어요. 다시 시도해주세요."
      onSubmit={(values) => mutateAsync(values)}
    />
  );
}

function EditFolderForm() {
  const { mutateAsync } = useUpdateFolderMutation();
  // 목록에서 이미 가진 값이라 상세를 다시 조회하지 않고 params 로 받는다.
  const { id, name, color } = useLocalSearchParams<{
    id: string;
    name: string;
    color?: string;
  }>();

  return (
    <FolderFormCard
      title="폴더 편집"
      defaultValues={{
        folderName: name ?? "",
        color: toSelectableColor(color),
      }}
      failureMessage="폴더를 수정하지 못했어요. 다시 시도해주세요."
      onSubmit={(values, dirtyFields) =>
        mutateAsync({
          folderId: id,
          folderName: values.folderName,
          // 색을 고르지 않았으면 보내지 않는다 — 팔레트 밖 색으로 들어온 폴더는
          // 폼에 폴백 색이 잡혀 있어, 그대로 보내면 이름만 고쳐도 색이 덮인다.
          color: dirtyFields.color ? values.color : undefined,
        })
      }
    />
  );
}

/** 팔레트 밖 값(기본색 등)으로 편집을 시작하면 폼이 검증에 걸리므로 선택 가능한 색으로 맞춘다. */
function toSelectableColor(color?: string): SelectableFolderColor {
  return FOLDER_COLOR_OPTIONS.includes(color as SelectableFolderColor)
    ? (color as SelectableFolderColor)
    : "blue";
}

/** 사용자가 실제로 건드린 필드. 편집은 바뀐 필드만 보내야 해서 제출 시 함께 넘긴다. */
type FolderFormDirtyFields = Partial<Record<keyof CreateFolderInput, boolean>>;

interface FolderFormCardProps {
  /** 카드 상단 문구 — "새 폴더 만들기" / "폴더 편집". */
  title: string;
  defaultValues: CreateFolderInput;
  /** 중복 이름 외 실패를 알릴 스낵바 문구. */
  failureMessage: string;
  onSubmit: (
    values: CreateFolderInput,
    dirtyFields: FolderFormDirtyFields,
  ) => Promise<unknown>;
}

/** 두 모드가 공유하는 폼·레이아웃과, 성공/실패 뒤처리(닫기·중복 안내·스낵바). */
function FolderFormCard({
  title,
  defaultValues,
  failureMessage,
  onSubmit,
}: FolderFormCardProps) {
  const router = useRouter();
  const { show } = useSnackbar();
  const [isDuplicateOpen, setIsDuplicateOpen] = useState(false);
  const { control, handleSubmit, formState } = useForm<CreateFolderInput>({
    resolver: zodResolver(createFolderSchema),
    mode: "onChange",
    defaultValues,
  });

  // 렌더 중에 읽어야 RHF 가 변화를 구독해 최신 값을 유지한다.
  const { dirtyFields, isValid, isSubmitting } = formState;
  const saveDisabled = !isValid || isSubmitting;

  const close = () => router.back();

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values, dirtyFields);
      close();
    } catch (error) {
      // 중복 이름은 고쳐 쓸 수 있게 다이얼로그로 잡아두고, 그 외는 스낵바로 알린다.
      if (isDuplicateFolderNameError(error)) {
        setIsDuplicateOpen(true);
        return;
      }
      show({ message: failureMessage });
    }
  });

  return (
    <>
      <Dialog onDismiss={close}>
        {/* Figma Card: gray-800 + white-05 테두리, radius 36, padding 20, 최대 폭 335. */}
        <View className="w-full max-w-[335px] gap-10 rounded-[36px] border border-opacity-white-05 bg-gray-800 p-5">
          <View className="gap-4">
            <Text variant="heading-2" className="text-center text-text-strong">
              {title}
            </Text>

            <View className="gap-5">
              <View className="gap-2">
                <Text variant="heading-3" className="text-icon-normal">
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

              <View className="gap-5">
                <Text variant="heading-3" className="text-icon-normal">
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
            </View>
          </View>

          <View className="flex-row gap-2">
            <ActionButton
              variant="assistive"
              className="flex-1"
              onPress={close}
            >
              취소
            </ActionButton>
            <ActionButton
              className="flex-1"
              disabled={saveDisabled}
              onPress={submit}
            >
              저장
            </ActionButton>
          </View>
        </View>
      </Dialog>

      <DuplicateFolderNameAlert
        isOpen={isDuplicateOpen}
        onClose={() => setIsDuplicateOpen(false)}
      />
    </>
  );
}
