import { zodResolver } from "@hookform/resolvers/zod";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Star } from "lucide-react-native";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ScrollView, View } from "react-native";
import {
  AlertDialog,
  AlertDialogButton,
} from "@/components/ui/alert-dialog/AlertDialog";
import { Header, useHeaderHeight } from "@/components/ui/header/Header";
import { HeaderBackButton } from "@/components/ui/header/HeaderBackButton";
import { IconButton } from "@/components/ui/icon-button/IconButton";
import { useSnackbar } from "@/components/ui/snackbar/SnackbarProvider";
import { Text } from "@/components/ui/text/Text";
import { archiveDetailHref, moveLinksHref } from "@/constants/routes.constants";
import { useDeleteLinkMutation } from "@/entities/link/link.queries";
import { formatCalendarDate } from "@/utils/format";
import { shareUrl } from "@/utils/share";

import {
  AiSummarySection,
  shouldShowAiSummary,
} from "./components/AiSummarySection";
import { FolderBadge } from "./components/FolderBadge";
import { LinkMoreMenu } from "./components/LinkMoreMenu";
import { LinkThumbnail } from "./components/LinkThumbnail";
import { MemoField } from "./components/MemoField";
import { RelatedLinksList } from "./components/RelatedLinksList";
import { type LinkDetailForm, linkDetailFormSchema } from "./link.contracts";
import {
  mockLinkDetail,
  mockLinkDetailUnclassified,
} from "./mock/mockLinkDetail";

// 백엔드 연동 전까지 상세 조회 가능한 목업 링크.
const mockLinks = [mockLinkDetail, mockLinkDetailUnclassified];

export function LinkDetailScreen() {
  const headerHeight = useHeaderHeight();
  const { id } = useLocalSearchParams<"/link/[id]">();
  const linkDetail =
    mockLinks.find((link) => link.linkId === Number(id)) ?? mockLinkDetail;

  const router = useRouter();
  const { show } = useSnackbar();
  const { mutateAsync: deleteLink } = useDeleteLinkMutation();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // 미분류 "폴더선택" → 폴더 선택 시트(타이틀 "폴더 선택")
  const handleSelectFolder = () => {
    router.push(moveLinksHref([linkDetail.linkId], undefined, "폴더 선택"));
  };

  // 지정 폴더 칩 탭 → 해당 폴더 상세로 이동
  const handleOpenFolder = () => {
    if (linkDetail.folder) {
      router.push(archiveDetailHref(String(linkDetail.folder.folderId)));
    }
  };

  const handleMove = () => {
    router.push(
      moveLinksHref(
        [linkDetail.linkId],
        linkDetail.folder ? String(linkDetail.folder.folderId) : undefined,
      ),
    );
  };

  const handleShare = async () => {
    const result = await shareUrl(linkDetail.url);
    if (result === "copied") show({ message: "링크가 복사됐어요" });
  };

  const handleDeleteConfirm = async () => {
    setIsDeleteOpen(false);
    try {
      await deleteLink(linkDetail.linkId);
      router.back();
    } catch {
      show({ message: "링크를 삭제하지 못했어요. 다시 시도해주세요." });
    }
  };

  // 이 화면은 링크 하나를 편집하는 단일 폼이다. 서버로 나가는 값(폴더·메모·즐겨찾기)만
  // 폼이 소유하고, 편집 모드·요약 펼침 같은 화면 조작 상태는 각 컴포넌트가 그대로 가진다.
  // TODO(#33): 저장 연동. 필드 변경 감지(watch) → PATCH /links/{linkId}(folder·memo·isFavorite).
  //  비동기 조회로 바뀌면 defaultValues 대신 reset 필요.
  const { control } = useForm<LinkDetailForm>({
    resolver: zodResolver(linkDetailFormSchema),
    defaultValues: {
      folder: linkDetail.folder,
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
              background={false}
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
                  <LinkMoreMenu
                    onMove={handleMove}
                    onShare={handleShare}
                    onDelete={() => setIsDeleteOpen(true)}
                  />
                </>
              }
            />
          ),
        }}
      />
      {/* 배경은 다른 화면과 동일한 기본 배경 — 이미지 블러·대표색 추출 없음(Figma 정책 106:12076). */}
      <View className="flex-1 bg-background-base">
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-6 pb-8"
          contentContainerStyle={{ paddingTop: headerHeight + 16 }}
          contentInsetAdjustmentBehavior="automatic"
        >
          <View className="px-5">
            {/* 서버는 현재 대표 이미지를 단수(thumbnailUrl)로 준다 — 배열로 매핑해
                단수·복수·없음을 모두 커버한다. 서버가 배열을 주면 그대로 넘긴다. */}
            <LinkThumbnail
              imageUrls={
                linkDetail.thumbnailUrl ? [linkDetail.thumbnailUrl] : []
              }
              url={linkDetail.url}
            />
          </View>

          <View className="gap-2 px-5">
            <Controller
              control={control}
              name="folder"
              render={({ field }) => (
                <FolderBadge
                  folder={field.value}
                  folderColor={linkDetail.folderColor}
                  onSelectFolder={handleSelectFolder}
                  onOpenFolder={handleOpenFolder}
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

          {shouldShowAiSummary(
            linkDetail.processingStatus,
            linkDetail.aiSummary,
          ) && (
            <View className="px-5">
              <AiSummarySection
                status={linkDetail.processingStatus}
                summary={linkDetail.aiSummary}
              />
            </View>
          )}

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
      <AlertDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="링크를 삭제할까요?"
        description="삭제된 링크는 최근 삭제된 항목으로 이동돼요"
        actions={
          <>
            <AlertDialogButton
              label="취소"
              variant="secondary"
              onPress={() => setIsDeleteOpen(false)}
            />
            <AlertDialogButton
              label="삭제"
              variant="destructive"
              onPress={handleDeleteConfirm}
            />
          </>
        }
      />
    </>
  );
}
