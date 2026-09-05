import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";
import Reanimated, { useAnimatedStyle } from "react-native-reanimated";

import { AsyncBoundary } from "@/components/ui/async-boundary/AsyncBoundary";
import { BottomSheetHeader } from "@/components/ui/bottom-sheet/BottomSheetHeader";
import { Text } from "@/components/ui/text/Text";
import { isAndroid } from "@/constants/platform.constants";
import { FolderChipList } from "@/features/link/components/FolderChipList";
import { LinkPreviewCard } from "@/features/link/components/LinkPreviewCard";
import { MemoField } from "@/features/link/components/MemoField";
import { ReminderSection } from "@/features/link/components/ReminderSection";
import type { ReminderValue } from "@/features/link/reminder.utils";

import { FolderCreateModal } from "./FolderCreateModal";
import { SheetFrame } from "./SheetFrame";

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
  onCancel: () => void;
}

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
  onCancel,
}: EntrySheetProps) {
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  // Android 시트는 화면 바닥에 붙어 있어 키보드 높이(열리면 음수)만큼 스크롤 영역 아래를 띄우면 된다.
  // KeyboardAvoidingView 는 부모 기준 좌표로 겹침을 계산해 시트 안에서는 0 이 나온다.
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();
  const keyboardPaddingStyle = useAnimatedStyle(() => ({
    paddingBottom: isAndroid ? -keyboardHeight.value : 0,
  }));

  return (
    <SheetFrame>
      <View pointerEvents={isSaving ? "none" : "auto"}>
        <BottomSheetHeader
          title="링크 저장"
          onCancel={onCancel}
          onConfirm={onSave}
          isConfirmPending={isSaving}
        />
      </View>
      {/* 시트 높이는 빌드 타임 고정(iOS) — 콘텐츠가 넘치는 작은 화면·리마인드 On 상태는
          세로 스크롤로 흡수한다. 헤더(취소·저장)는 스크롤 밖에 고정. */}
      {/* 시트 컨테이너는 키보드에 밀리지 않는다 — iOS 는 스크롤 인셋, Android(edge-to-edge 창은
          adjustResize 로 줄지 않음)는 패딩으로 스크롤 영역을 줄여 메모 입력이 키보드 위로 올라오게 한다. */}
      <Reanimated.View
        testID="share-entry-keyboard-area"
        className="flex-1"
        style={keyboardPaddingStyle}
      >
        <ScrollView
          testID="share-entry-scroll"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          contentContainerClassName="px-5 pb-4"
        >
          <View pointerEvents={isSaving ? "none" : "auto"} className="gap-6">
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
        </ScrollView>
      </Reanimated.View>
    </SheetFrame>
  );
}
