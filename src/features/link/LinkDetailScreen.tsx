import { zodResolver } from "@hookform/resolvers/zod";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Star } from "lucide-react-native";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ScrollView, View } from "react-native";
import {
  AlertDialog,
  AlertDialogButton,
} from "@/components/ui/alert-dialog/AlertDialog";
import { AsyncBoundary } from "@/components/ui/async-boundary/AsyncBoundary";
import { Header, useHeaderHeight } from "@/components/ui/header/Header";
import { HeaderBackButton } from "@/components/ui/header/HeaderBackButton";
import { IconButton } from "@/components/ui/icon-button/IconButton";
import { useSnackbar } from "@/components/ui/snackbar/SnackbarProvider";
import { Spinner } from "@/components/ui/spinner/Spinner";
import { Text } from "@/components/ui/text/Text";
import { archiveDetailHref, moveLinksHref } from "@/constants/routes.constants";
import {
  linkQueries,
  useDeleteLinkMutation,
  useUpdateLinkMutation,
} from "@/entities/link/link.queries";
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

// 로딩 — 화면 가운데 스피너.
function LinkDetailPending() {
  return (
    <View className="flex-1 items-center justify-center bg-background-base">
      <Spinner size="medium" tone="on-dark" />
    </View>
  );
}

// 에러 — 재시도.
function LinkDetailError({ onRetry }: { onRetry: () => void }) {
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-background-base px-5">
      <Text variant="body-2-reading" className="text-text-alternative">
        링크를 불러오지 못했어요.
      </Text>
      <Text
        accessibilityRole="button"
        onPress={onRetry}
        variant="label-1"
        className="text-old-icon-accent"
      >
        다시 시도
      </Text>
    </View>
  );
}

export function LinkDetailScreen() {
  return (
    <AsyncBoundary
      pending={<LinkDetailPending />}
      fallback={({ reset }) => <LinkDetailError onRetry={reset} />}
    >
      <LinkDetailContent />
    </AsyncBoundary>
  );
}

function LinkDetailContent() {
  const headerHeight = useHeaderHeight();
  const { id } = useLocalSearchParams<"/link/[id]">();
  const { data: linkDetail } = useSuspenseQuery(linkQueries.detail(id));

  const router = useRouter();
  const { show } = useSnackbar();
  const { mutateAsync: deleteLink } = useDeleteLinkMutation();
  // 변경 시점 저장(추천안): 이탈 이벤트(뒤로가기·홈·강제종료 등)에 의존하지 않아 유실이 없고,
  // 폴더 이동(MoveLinksSheet)의 "동작 시점 저장"과도 일관된다. 상세: plan/task/task-server-integration.md.
  const { mutate: updateLink } = useUpdateLinkMutation();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const handleToggleFavorite = (current: boolean) => {
    updateLink({ linkId: linkDetail.linkId, isFavorite: !current });
  };

  const handleMemoBlur = (memo: string) => {
    // 서버값과 다를 때만 저장 — 열어만 보고 닫으면 요청하지 않는다.
    if (memo !== (linkDetail.memo ?? "")) {
      updateLink({ linkId: linkDetail.linkId, memo });
    }
  };

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
  // 폼이 소유한다. `values` 로 서버 데이터를 싣어, 저장 후 refetch·폴더 이동 시 폼이 최신값을 따른다.
  const { control } = useForm<LinkDetailForm>({
    resolver: zodResolver(linkDetailFormSchema),
    values: {
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
                        onPress={() => {
                          handleToggleFavorite(field.value);
                          field.onChange(!field.value);
                        }}
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
                <MemoField
                  memo={field.value}
                  onChangeMemo={field.onChange}
                  onBlur={() => handleMemoBlur(field.value)}
                />
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
