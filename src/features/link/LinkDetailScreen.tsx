import { zodResolver } from "@hookform/resolvers/zod";
import type { LinkTag } from "@shared/types/link.types";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { Ellipsis, Star } from "lucide-react-native";
import { Controller, useForm } from "react-hook-form";
import { ScrollView, View } from "react-native";

import { Header, useHeaderHeight } from "@/components/ui/header/Header";
import { HeaderBackButton } from "@/components/ui/header/HeaderBackButton";
import { IconButton } from "@/components/ui/icon-button/IconButton";
import { Text } from "@/components/ui/text/Text";
import { formatCalendarDate } from "@/utils/format";

import { linkQueries, useUpdateLinkMutation } from "./api/link.queries";
import { AiSummarySection } from "./components/AiSummarySection";
import { FolderBadge } from "./components/FolderBadge";
import { LinkBackground } from "./components/LinkBackground";
import { LinkThumbnail } from "./components/LinkThumbnail";
import { MemoField } from "./components/MemoField";
import { RelatedLinksList } from "./components/RelatedLinksList";
import { TagEditor } from "./components/TagEditor";
import { type LinkDetailForm, linkDetailFormSchema } from "./link.contracts";

// TODO(#33): 태그 추가/삭제가 서버 호출(POST/DELETE /links/{linkId}/tags)로 바뀌면
//  아래 두 함수는 사라진다 — tagId 를 서버가 내려주므로 임시 id 생성도 함께 없어진다.
function appendTag(tags: LinkTag[], name: string): LinkTag[] {
  return [
    ...tags,
    { tagId: Date.now(), name, sourceType: "user", sortOrder: tags.length },
  ];
}

function removeTagById(tags: LinkTag[], tagId: number): LinkTag[] {
  return tags.filter((tag) => tag.tagId !== tagId);
}

export function LinkDetailScreen() {
  const headerHeight = useHeaderHeight();
  const { id } = useLocalSearchParams<"/link/[id]">();
  const { data: linkDetail } = useSuspenseQuery(linkQueries.detail(Number(id)));
  const updateLink = useUpdateLinkMutation();

  // 이 화면은 링크 하나를 편집하는 단일 폼이다. 즐겨찾기는 즉시 PATCH 로 영속하고(보관함 카운트 반영),
  // 폴더·태그·메모는 화면 폼 상태로만 둔다(서버 편집 연동은 #33).
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
          headerTransparent: true,
          header: () => (
            <Header
              variant="plain"
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
                        onPress={() => {
                          const next = !field.value;
                          field.onChange(next);
                          updateLink.mutate({
                            linkId: linkDetail.linkId,
                            patch: { isFavorite: next },
                          });
                        }}
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
          contentContainerClassName="gap-6 pb-8"
          contentContainerStyle={{ paddingTop: headerHeight + 16 }}
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
              {formatCalendarDate(linkDetail.savedAt)}
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
                  onAddTag={(name) =>
                    field.onChange(appendTag(field.value, name))
                  }
                  onRemoveTag={(tagId) =>
                    field.onChange(removeTagById(field.value, tagId))
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
