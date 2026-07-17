import { Stack, useLocalSearchParams } from "expo-router";
import { Ellipsis, Star } from "lucide-react-native";
import { useState } from "react";
import { ScrollView, View } from "react-native";

import { Header } from "@/components/ui/header/Header";
import { HeaderBackButton } from "@/components/ui/header/HeaderBackButton";
import { IconButton } from "@/components/ui/icon-button/IconButton";
import { Text } from "@/components/ui/text/Text";

import { AiSummarySection } from "./components/AiSummarySection";
import { FolderBadge } from "./components/FolderBadge";
import { LinkBackground } from "./components/LinkBackground";
import { LinkThumbnail } from "./components/LinkThumbnail";
import { MemoField } from "./components/MemoField";
import { RelatedLinksList } from "./components/RelatedLinksList";
import { TagEditor } from "./components/TagEditor";
import {
  mockLinkDetail,
  mockLinkDetailUnclassified,
  mockRelatedLinks,
} from "./mock/mockLinkDetail";

// 백엔드 연동 전까지 상세 조회 가능한 목업 링크.
const mockLinks = [mockLinkDetail, mockLinkDetailUnclassified];

// savedAt(ISO 8601)의 날짜 부분만 취해 "YYYY.MM.DD"로 바꾼다. Date 객체를 거치면
// 로컬 타임존에 따라 날짜가 하루 밀릴 수 있어 문자열을 직접 자른다.
function formatSavedDate(savedAt: string): string {
  return savedAt.slice(0, 10).replaceAll("-", ".");
}

export function LinkDetailScreen() {
  const { id } = useLocalSearchParams<"/link/[id]">();
  const linkDetail =
    mockLinks.find((link) => link.linkId === Number(id)) ?? mockLinkDetail;

  const [tags, setTags] = useState<string[]>(linkDetail.tags);
  const [memo, setMemo] = useState<string>(linkDetail.memo);

  function handleAddTag(tag: string) {
    setTags((prev) => [...prev, tag]);
  }

  function handleRemoveTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTransparent: true,
          header: () => (
            <Header
              variant="plain"
              left={<HeaderBackButton />}
              right={
                <>
                  <IconButton iconNode={Star} accessibilityLabel="즐겨찾기" />
                  <IconButton iconNode={Ellipsis} accessibilityLabel="더보기" />
                </>
              }
            />
          ),
        }}
      />
      <View className="flex-1">
        <LinkBackground
          thumbnailUrl={linkDetail.thumbnailUrl}
          dominantColor={linkDetail.dominantColor}
        />
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-6 pt-4 pb-8"
          contentInsetAdjustmentBehavior="automatic"
        >
          <View className="px-5">
            <LinkThumbnail
              thumbnailUrl={linkDetail.thumbnailUrl}
              url={linkDetail.url}
            />
          </View>

          <View className="gap-2 px-5">
            <FolderBadge
              folder={linkDetail.folder}
              folderColor={linkDetail.folderColor}
            />
            <Text variant="heading-1">{linkDetail.title}</Text>
            <Text variant="caption-1" className="text-opacity-white-70">
              {linkDetail.source}
              <Text variant="caption-1" className="text-opacity-white-40">
                {" · "}
              </Text>
              {formatSavedDate(linkDetail.savedAt)}
            </Text>
          </View>

          <View className="px-5">
            <AiSummarySection summary={linkDetail.aiSummary} />
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
    </>
  );
}
