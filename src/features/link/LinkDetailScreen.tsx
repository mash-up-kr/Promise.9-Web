import { useState } from "react";
import { ScrollView, View } from "react-native";

import { Text } from "@/components/ui/text/Text";

import { AiSummarySection } from "./components/AiSummarySection";
import { FolderBadge } from "./components/FolderBadge";
import { LinkBackground } from "./components/LinkBackground";
import { LinkThumbnail } from "./components/LinkThumbnail";
import { MemoField } from "./components/MemoField";
import { RelatedLinksList } from "./components/RelatedLinksList";
import { TagEditor } from "./components/TagEditor";
import { mockLinkDetail, mockRelatedLinks } from "./mock/mockLinkDetail";

// savedAt(ISO 8601)의 날짜 부분만 취해 "YYYY.MM.DD"로 바꾼다. Date 객체를 거치면
// 로컬 타임존에 따라 날짜가 하루 밀릴 수 있어 문자열을 직접 자른다.
function formatSavedDate(savedAt: string): string {
  return savedAt.slice(0, 10).replaceAll("-", ".");
}

export function LinkDetailScreen() {
  const [tags, setTags] = useState<string[]>(mockLinkDetail.tags);
  const [memo, setMemo] = useState<string>(mockLinkDetail.memo);

  function handleAddTag(tag: string) {
    setTags((prev) => [...prev, tag]);
  }

  function handleRemoveTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  return (
    <View className="flex-1">
      <LinkBackground
        thumbnailUrl={mockLinkDetail.thumbnailUrl}
        dominantColor={mockLinkDetail.dominantColor}
      />
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-6 pt-4 pb-8"
        contentInsetAdjustmentBehavior="automatic"
      >
        <View className="px-5">
          <LinkThumbnail
            thumbnailUrl={mockLinkDetail.thumbnailUrl}
            url={mockLinkDetail.url}
          />
        </View>

        <View className="gap-2 px-5">
          <FolderBadge
            folder={mockLinkDetail.folder}
            folderColor={mockLinkDetail.folderColor}
          />
          <Text variant="heading-1">{mockLinkDetail.title}</Text>
          <Text variant="caption-1" className="text-opacity-white-70">
            {mockLinkDetail.source}
            <Text variant="caption-1" className="text-opacity-white-40">
              {" · "}
            </Text>
            {formatSavedDate(mockLinkDetail.savedAt)}
          </Text>
        </View>

        <View className="px-5">
          <AiSummarySection summary={mockLinkDetail.aiSummary} />
        </View>

        <View className="px-5">
          <TagEditor
            tags={tags}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
          />
        </View>

        <View className="px-5">
          <MemoField memo={memo} onChangeMemo={setMemo} />
        </View>

        <View className="mt-6">
          <RelatedLinksList items={mockRelatedLinks} />
        </View>
      </ScrollView>
    </View>
  );
}
