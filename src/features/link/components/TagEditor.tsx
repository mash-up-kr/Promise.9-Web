import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";

import { CloseIcon } from "@/components/ui/icon/CloseIcon";
import { PlusIcon } from "@/components/ui/icon/PlusIcon";
import { TooltipArrowIcon } from "@/components/ui/icon/TooltipArrowIcon";
import { Text } from "@/components/ui/text/Text";
import { tv } from "@/lib/tv";

const MAX_TAGS = 10;
const PLACEHOLDER = "태그를 입력해 주세요";
const HELPER_TEXT = "태그는 최대 10개까지 추가할 수 있어요";
const TOOLTIP_TEXT = "태그를 추가하면 링크를 더 쉽게 찾을 수 있어요";

const inputContainerStyles = tv({
  base: "h-12 w-full flex-row items-center gap-1 rounded-[16px] border-[0.5px] border-opacity-white-20 px-3",
  variants: {
    empty: {
      true: "bg-opacity-black-20",
      false: "bg-opacity-white-10",
    },
  },
});

const addButtonStyles = tv({
  base: "h-8 items-center justify-center rounded-[12px] px-3",
  variants: {
    disabled: {
      true: "bg-blue-700",
      false: "bg-blue-500",
    },
  },
});

const addButtonLabelStyles = tv({
  variants: {
    disabled: {
      true: "text-gray-200",
      false: "text-gray-50",
    },
  },
});

export interface TagEditorProps {
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
}

export function TagEditor({ tags, onAddTag, onRemoveTag }: TagEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftValue, setDraftValue] = useState("");
  const [duplicateTag, setDuplicateTag] = useState<string | null>(null);
  // 편집 세션 동안 입력에 한 번이라도 손댔는지 — 온보딩 툴팁은 최초의 빈 입력
  // 상태에서만 노출하고, 타이핑/추가 이후엔(입력이 다시 비어도) 다시 띄우지 않는다.
  const [hasEditedDraft, setHasEditedDraft] = useState(false);

  const isFull = tags.length >= MAX_TAGS;
  const isAddDisabled = draftValue.trim() === "" || isFull;
  const showTooltip = isEditing && !hasEditedDraft && !isFull;

  function enterEditMode() {
    setIsEditing(true);
    setDraftValue("");
    setDuplicateTag(null);
    setHasEditedDraft(false);
  }

  function handleChangeText(value: string) {
    setDraftValue(value);
    setHasEditedDraft(true);
    setDuplicateTag(null);
  }

  function handleAdd() {
    const value = draftValue.trim();
    if (value === "" || isFull) return;
    if (tags.includes(value)) {
      setDuplicateTag(value);
      return;
    }
    onAddTag(value);
    setDraftValue("");
    setDuplicateTag(null);
  }

  if (!isEditing) {
    return (
      <View className="w-full flex-row flex-wrap items-center gap-2">
        <Pressable
          accessibilityRole="button"
          onPress={enterEditMode}
          className="h-9 flex-row items-center gap-1 rounded-full bg-gray-50 px-3"
        >
          <PlusIcon />
          <Text variant="label-2-semibold" className="text-icon-inverse">
            태그 추가
          </Text>
        </Pressable>
        {tags.map((tag) => (
          <View
            key={tag}
            className="h-9 items-center justify-center rounded-full bg-opacity-white-20 px-3"
          >
            <Text variant="label-2-medium" className="text-opacity-white-80">
              #{tag}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View className="w-full items-end gap-4 rounded-[20px] bg-opacity-white-05 px-4 pt-4 pb-3">
      {showTooltip && (
        <View
          pointerEvents="none"
          className="absolute top-0 left-4 z-10 -translate-y-full items-center"
        >
          <View className="rounded-[10px] bg-opacity-white-60 px-3 py-2 web:backdrop-blur">
            <Text variant="caption-2" className="text-icon-inverse">
              {TOOLTIP_TEXT}
            </Text>
          </View>
          <TooltipArrowIcon />
        </View>
      )}

      <View className="w-full gap-6">
        <View className="w-full gap-4">
          <View className="flex-row items-center gap-2">
            <Text variant="heading-3">태그</Text>
            <Text variant="caption-1" className="text-blue-500">
              {tags.length}/{MAX_TAGS}
            </Text>
          </View>

          <View className="w-full gap-2">
            <View
              className={inputContainerStyles({ empty: draftValue === "" })}
            >
              <Text variant="body-2-normal" className="text-opacity-white-80">
                #
              </Text>
              <TextInput
                value={draftValue}
                editable={!isFull}
                onChangeText={handleChangeText}
                onSubmitEditing={handleAdd}
                placeholder={PLACEHOLDER}
                // placeholderTextColor 는 className 으로 못 받아 리터럴로 지정 — #ffffff4d = --color-opacity-white-30
                placeholderTextColor="#ffffff4d"
                returnKeyType="done"
                className="min-w-px flex-1 font-pretendard-medium text-body-2-normal text-opacity-white-80"
                style={{ padding: 0 }}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: isAddDisabled }}
                onPress={handleAdd}
                disabled={isAddDisabled}
                className={addButtonStyles({ disabled: isAddDisabled })}
              >
                <Text
                  variant="label-2-semibold"
                  className={addButtonLabelStyles({ disabled: isAddDisabled })}
                >
                  추가
                </Text>
              </Pressable>
            </View>
            <Text variant="caption-2" className="text-opacity-white-40">
              {duplicateTag
                ? `‘${duplicateTag}’은 이미 추가된 태그예요`
                : HELPER_TEXT}
            </Text>
          </View>
        </View>

        <View className="w-full flex-row flex-wrap items-start gap-2">
          {tags.map((tag) => (
            <View
              key={tag}
              className="h-9 flex-row items-center gap-2 rounded-full bg-opacity-white-10 px-3"
            >
              <Text variant="label-2-medium" className="text-opacity-white-80">
                #{tag}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${tag} 삭제`}
                onPress={() => onRemoveTag(tag)}
                className="h-5 w-5 items-center justify-center rounded-full bg-opacity-black-30"
              >
                <CloseIcon />
              </Pressable>
            </View>
          ))}
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => setIsEditing(false)}
        className="h-8 items-center justify-center rounded-[12px] px-3"
      >
        <Text variant="label-2-semibold" className="text-gray-50">
          완료
        </Text>
      </Pressable>
    </View>
  );
}
