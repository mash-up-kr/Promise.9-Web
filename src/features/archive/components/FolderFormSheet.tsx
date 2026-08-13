import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Pressable, View } from "react-native";

import { Dialog } from "@/components/ui/dialog/Dialog";
import { Input, InputField } from "@/components/ui/input/Input";
import { Text } from "@/components/ui/text/Text";
import { tv } from "@/lib/tv";

import {
  type CreateFolderInput,
  createFolderSchema,
} from "../archive.contracts";
import { FolderColorPicker } from "./FolderColorPicker";

// Figma "Action Button" 중 이 시트가 쓰는 두 타입.
// primary=흰 배경/어두운 텍스트(저장), assistive=진회색 배경/흰 텍스트(취소).
const actionButtonStyles = tv({
  base: "h-12 flex-1 flex-row items-center justify-center rounded-full px-4 py-3",
  variants: {
    variant: {
      primary: "border border-opacity-white-20 bg-white",
      assistive: "bg-gray-600",
    },
    disabled: { true: "bg-gray-200", false: "" },
  },
});

const actionButtonLabelStyles = tv({
  base: "",
  variants: {
    variant: { primary: "text-gray-800", assistive: "text-text-strong" },
    disabled: { true: "text-gray-400", false: "" },
  },
});

export interface FolderFormSheetProps {
  /** 카드 상단 문구 — "새 폴더 만들기" / "폴더 편집". */
  title: string;
  defaultValues: CreateFolderInput;
  isSubmitting: boolean;
  onSubmit: (values: CreateFolderInput) => void;
  onCancel: () => void;
}

/**
 * 폴더 이름·색상 입력 모달 (Figma "Folder Edit Modal").
 *
 * 바텀시트가 아니라 화면 중앙 카드다 — 라우트 자체가 transparentModal 이라 여기서는
 * dim 배경과 가운데 카드만 그린다. 키보드가 올라오면 카드가 그 위로 밀린다.
 * 생성과 편집이 같은 폼이라 문구·초기값·제출 동작만 주입받는다.
 */
export function FolderFormSheet({
  title,
  defaultValues,
  isSubmitting,
  onSubmit,
  onCancel,
}: FolderFormSheetProps) {
  const { control, handleSubmit, formState } = useForm<CreateFolderInput>({
    resolver: zodResolver(createFolderSchema),
    mode: "onChange",
    defaultValues,
  });

  const saveDisabled = !formState.isValid || isSubmitting;

  return (
    <Dialog onDismiss={onCancel}>
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="취소"
            onPress={onCancel}
            className={actionButtonStyles({ variant: "assistive" })}
          >
            <Text
              variant="heading-3-medium"
              className={actionButtonLabelStyles({ variant: "assistive" })}
            >
              취소
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="저장"
            accessibilityState={{ disabled: saveDisabled }}
            disabled={saveDisabled}
            onPress={handleSubmit(onSubmit)}
            className={actionButtonStyles({
              variant: "primary",
              disabled: saveDisabled,
            })}
          >
            <Text
              variant="heading-3-medium"
              className={actionButtonLabelStyles({
                variant: "primary",
                disabled: saveDisabled,
              })}
            >
              저장
            </Text>
          </Pressable>
        </View>
      </View>
    </Dialog>
  );
}
