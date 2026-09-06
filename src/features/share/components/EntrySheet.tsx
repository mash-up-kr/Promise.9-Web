import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AsyncBoundary } from "@/components/ui/async-boundary/AsyncBoundary";
import { BottomSheetHeader } from "@/components/ui/bottom-sheet/BottomSheetHeader";
import { useSheetDismiss } from "@/components/ui/bottom-sheet/useSheetDismiss";
import { Text } from "@/components/ui/text/Text";
import { FolderChipList } from "@/features/link/components/FolderChipList";
import { LinkPreviewCard } from "@/features/link/components/LinkPreviewCard";
import { MemoField } from "@/features/link/components/MemoField";
import { ReminderSection } from "@/features/link/components/ReminderSection";
import type { ReminderValue } from "@/features/link/reminder.utils";

import { FolderCreateModal } from "./FolderCreateModal";

export interface EntrySheetProps {
  url: string;
  isSaving: boolean;
  selectedFolderId: number | null;
  onSelectFolder: (folderId: number | null) => void;
  reminder: ReminderValue | null;
  onChangeReminder: (reminder: ReminderValue | null) => void;
  memo: string;
  onChangeMemo: (memo: string) => void;
  onSave: () => void;
}

// 인앱 저장 시트(SheetScreen)와 같은 스캐폴드 — 헤더는 스크롤뷰의 sticky 첫 요소, 본문은 px-5.
// 시트 높이는 gorhom 동적 사이징이 콘텐츠만큼 키우고, 넘치면 안에서 스크롤한다.
export function EntrySheet({
  url,
  isSaving,
  selectedFolderId,
  onSelectFolder,
  reminder,
  onChangeReminder,
  memo,
  onChangeMemo,
  onSave,
}: EntrySheetProps) {
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const insets = useSafeAreaInsets();
  const dismiss = useSheetDismiss();

  return (
    <BottomSheetScrollView
      testID="share-entry-scroll"
      keyboardShouldPersistTaps="handled"
      // iOS 익스텐션 프로세스는 RN 키보드 이벤트 높이가 0 으로 와서 gorhom 이 시트를 못 올린다 —
      // 네이티브 스크롤 인셋으로 포커스한 입력을 키보드 위로 드러낸다(앱에선 gorhom 이 맡는다).
      automaticallyAdjustKeyboardInsets
      stickyHeaderIndices={[0]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
    >
      <View
        pointerEvents={isSaving ? "none" : "auto"}
        className="bg-background-base"
      >
        <BottomSheetHeader
          title="링크 저장"
          onCancel={dismiss}
          onConfirm={onSave}
          isConfirmPending={isSaving}
        />
      </View>
      <View
        pointerEvents={isSaving ? "none" : "auto"}
        className="gap-6 px-5 pt-1"
      >
        {/* 시안 통합 카드(인앱 CreateLinkSheet 미러) — 프리뷰(파비콘·제목)와 URL 을 한 카드로. */}
        <View className="w-full rounded-[20px] bg-opacity-white-10">
          <View className="px-4 pt-4">
            <LinkPreviewCard url={url} isBare />
            <View className="mt-4 h-px w-full bg-opacity-white-10" />
          </View>
          <View className="px-4 py-3">
            <Text
              variant="body-2-normal"
              className="text-text-alternative"
              numberOfLines={2}
            >
              {url}
            </Text>
          </View>
        </View>

        {/* 폴더는 부가 기능 — 조회가 실패하면 칩만 숨기고 미분류 저장은 계속된다. */}
        <AsyncBoundary pending={null} fallback={null}>
          <FolderChipList
            value={selectedFolderId}
            onChange={onSelectFolder}
            onAddFolder={() => setIsCreatingFolder(true)}
          />
        </AsyncBoundary>

        <ReminderSection value={reminder} onChange={onChangeReminder} />

        <MemoField memo={memo} onChangeMemo={onChangeMemo} />
      </View>
      {isCreatingFolder && (
        <FolderCreateModal onClose={() => setIsCreatingFolder(false)} />
      )}
    </BottomSheetScrollView>
  );
}
