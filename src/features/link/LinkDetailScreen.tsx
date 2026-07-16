import { zodResolver } from "@hookform/resolvers/zod";
import type { LinkTag } from "@shared/types/link.types";
import { Stack, useLocalSearchParams } from "expo-router";
import { Ellipsis, Star } from "lucide-react-native";
import { Controller, useForm } from "react-hook-form";
import { ScrollView, View } from "react-native";

import { Header } from "@/components/ui/header/Header";
import { HeaderBackButton } from "@/components/ui/header/HeaderBackButton";
import { IconButton } from "@/components/ui/icon-button/IconButton";
import { Text } from "@/components/ui/text/Text";
import { formatSavedDate } from "@/utils/format";

import { AiSummarySection } from "./components/AiSummarySection";
import { FolderBadge } from "./components/FolderBadge";
import { LinkBackground } from "./components/LinkBackground";
import { LinkThumbnail } from "./components/LinkThumbnail";
import { MemoField } from "./components/MemoField";
import { RelatedLinksList } from "./components/RelatedLinksList";
import { TagEditor } from "./components/TagEditor";
import { type LinkDetailForm, linkDetailFormSchema } from "./link.contracts";
import {
  mockLinkDetail,
  mockLinkDetailUnclassified,
} from "./mock/mockLinkDetail";

// 백엔드 연동 전까지 상세 조회 가능한 목업 링크.
const mockLinks = [mockLinkDetail, mockLinkDetailUnclassified];

export function LinkDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const linkDetail =
    mockLinks.find((link) => link.linkId === Number(id)) ?? mockLinkDetail;

  // 이 화면은 링크 하나를 편집하는 단일 폼이다. 서버로 나가는 값(폴더·태그·메모·즐겨찾기)만
  // 폼이 소유하고, 편집 모드·요약 펼침 같은 화면 조작 상태는 각 컴포넌트가 그대로 가진다.
  // TODO(#33): 저장 연동. 필드 변경 감지(watch) → PATCH /links/{linkId}(folder·memo·isFavorite)
  //  + POST/DELETE /links/{linkId}/tags(태그). 비동기 조회로 바뀌면 defaultValues 대신 reset 필요.
  const { control } = useForm<LinkDetailForm>({
    resolver: zodResolver(linkDetailFormSchema),
    defaultValues: {
      folder: linkDetail.folder,
      tags: linkDetail.tags ?? [],
      memo: linkDetail.memo ?? "",
      isFavorite: linkDetail.isFavorite,
    },
  });

  return (
    <>
      <Stack.Screen
        options={{
          header: () => (
            <Header
              left={<HeaderBackButton />}
              right={
                <>
                  <Controller
                    control={control}
                    name="isFavorite"
                    render={({ field }) => (
                      <IconButton
                        iconNode={Star}
                        accessibilityLabel="즐겨찾기"
                        accessibilityState={{ selected: field.value }}
                        // 켜짐은 채운 별로 구분한다. 색은 IconButton 의 icon-strong 을 따른다.
                        iconFill={field.value ? "currentColor" : "none"}
                        onPress={() => field.onChange(!field.value)}
                      />
                    )}
                  />
                  <IconButton iconNode={Ellipsis} accessibilityLabel="더보기" />
                </>
              }
            />
          ),
        }}
      />
      <View className="flex-1">
        <LinkBackground
          thumbnailUrl={linkDetail.thumbnailUrl ?? ""}
          dominantColor={linkDetail.dominantColor}
        />
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-6 pt-4 pb-8"
          contentInsetAdjustmentBehavior="automatic"
        >
          <View className="px-5">
            <LinkThumbnail
              thumbnailUrl={linkDetail.thumbnailUrl ?? ""}
              url={linkDetail.url}
            />
          </View>

          <View className="gap-2 px-5">
            {/* TODO(#33): onPress → 폴더 선택 플로우(별도 이슈) 연결 */}
            <Controller
              control={control}
              name="folder"
              render={({ field }) => (
                <FolderBadge
                  folder={field.value}
                  folderColor={linkDetail.folderColor}
                />
              )}
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
            <AiSummarySection summary={linkDetail.aiSummary ?? ""} />
          </View>

          <View className="px-5">
            <Controller
              control={control}
              name="tags"
              render={({ field }) => (
                <TagEditor
                  tags={field.value}
                  onAddTag={(name) => {
                    // 로컬 폼 상태 전용 임시 id — 실제 연동(#33) 시 서버가 내려주는 tagId 로 대체.
                    const newTag: LinkTag = {
                      tagId: Date.now(),
                      name,
                      sourceType: "user",
                      sortOrder: field.value.length,
                    };
                    field.onChange([...field.value, newTag]);
                  }}
                  onRemoveTag={(tagId) =>
                    field.onChange(
                      field.value.filter((tag) => tag.tagId !== tagId),
                    )
                  }
                />
              )}
            />
          </View>

          <View className="px-5">
            <Controller
              control={control}
              name="memo"
              render={({ field }) => (
                <MemoField memo={field.value} onChangeMemo={field.onChange} />
              )}
            />
          </View>

          <View className="mt-6">
            <RelatedLinksList items={linkDetail.relatedLinks ?? []} />
          </View>
        </ScrollView>
      </View>
    </>
  );
}
