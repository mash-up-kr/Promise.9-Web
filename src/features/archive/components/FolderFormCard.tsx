import { zodResolver } from "@hookform/resolvers/zod";
import { isDuplicateFolderNameError } from "@shared/entities/folder/folder.errors";
import {
  type CreateFolderInput,
  createFolderSchema,
} from "@shared/folder/folder.contracts";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";
import { ActionButton } from "@/components/ui/action-button/ActionButton";
import { Dialog } from "@/components/ui/dialog/Dialog";
import { Input, InputField } from "@/components/ui/input/Input";
import { Text } from "@/components/ui/text/Text";
import { DuplicateFolderNameAlert } from "./DuplicateFolderNameAlert";
import { FolderColorPicker } from "./FolderColorPicker";

/** 사용자가 실제로 건드린 필드. 편집은 바뀐 필드만 보내야 해서 제출 시 함께 넘긴다. */
export type FolderFormDirtyFields = Partial<
  Record<keyof CreateFolderInput, boolean>
>;

export interface FolderFormCardProps {
  /** 카드 상단 문구 — "새 폴더 만들기" / "폴더 편집". */
  title: string;
  defaultValues: CreateFolderInput;
  onSubmit: (
    values: CreateFolderInput,
    dirtyFields: FolderFormDirtyFields,
  ) => Promise<unknown>;
  /** 취소·성공 후 닫기. */
  onClose: () => void;
  /** 중복 이름(다이얼로그로 처리) 외의 실패. */
  onError: (error: unknown) => void;
  /** 카드 안 색상 선택 아래에 보일 실패 문구(스낵바가 없는 표면용). */
  errorMessage?: string | null;
}

/** 두 모드가 공유하는 폼·레이아웃과, 성공/실패 뒤처리(닫기·중복 안내·에러 위임). */
export function FolderFormCard({
  title,
  defaultValues,
  onSubmit,
  onClose,
  onError,
  errorMessage,
}: FolderFormCardProps) {
  const [isDuplicateOpen, setIsDuplicateOpen] = useState(false);
  const { control, handleSubmit, formState } = useForm<CreateFolderInput>({
    resolver: zodResolver(createFolderSchema),
    mode: "onChange",
    defaultValues,
  });

  // 렌더 중에 읽어야 RHF 가 변화를 구독해 최신 값을 유지한다.
  const { dirtyFields, isValid, isSubmitting } = formState;
  const saveDisabled = !isValid || isSubmitting;

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values, dirtyFields);
      onClose();
    } catch (error) {
      // 중복 이름은 고쳐 쓸 수 있게 다이얼로그로 잡아두고, 그 외는 호출부에 위임한다.
      if (isDuplicateFolderNameError(error)) {
        setIsDuplicateOpen(true);
        return;
      }
      onError(error);
    }
  });

  return (
    <>
      <Dialog onDismiss={onClose}>
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
                        placeholder="폴더 이름을 입력해주세요"
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

              {errorMessage ? (
                <Text variant="caption-1" className="text-action-destructive">
                  {errorMessage}
                </Text>
              ) : null}
            </View>
          </View>

          <View className="flex-row gap-2">
            <ActionButton
              variant="assistive"
              className="flex-1"
              onPress={onClose}
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
