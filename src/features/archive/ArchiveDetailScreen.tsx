import type { Link } from "@shared/types/link.types";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Check, Search } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ActionButton } from "@/components/ui/action-button/ActionButton";
import {
  AlertDialog,
  AlertDialogButton,
} from "@/components/ui/alert-dialog/AlertDialog";
import { AsyncBoundary } from "@/components/ui/async-boundary/AsyncBoundary";
import { Header } from "@/components/ui/header/Header";
import { HeaderBackButton } from "@/components/ui/header/HeaderBackButton";
import { useHeaderAwareScrollHandler } from "@/components/ui/header/useHeaderAwareScrollHandler";
import { IconButton } from "@/components/ui/icon-button/IconButton";
import { LinkTile } from "@/components/ui/link-card/LinkTile";
import { useSnackbar } from "@/components/ui/snackbar/SnackbarProvider";
import { Text } from "@/components/ui/text/Text";
import {
  linkDetailHref,
  moveLinksHref,
  ROUTES,
} from "@/constants/routes.constants";
import {
  linkQueries,
  useDeleteLinkMutation,
} from "@/features/link/api/link.queries";
import { shareUrl } from "@/utils/share";

import { folderLinkQueries, isFolderRouteId } from "./api/folder-links.queries";
import { SYSTEM_FOLDERS } from "./archive.constants";
import type { LinkSortOption } from "./archive.types";
import { ArchiveDetailMoreMenu } from "./components/ArchiveDetailMoreMenu";
import { LinkContextMenu } from "./components/LinkContextMenu";

import { EmptyLinks } from "./components/EmptyLinks";
// 헤더 타이틀 — 이동 시 넘어온 폴더명을 우선 쓰고, 없으면 시스템 폴더명으로 폴백한다.
function resolveTitle(id: string | undefined, name?: string): string {
  if (name) return name;
  return SYSTEM_FOLDERS.find((folder) => folder.id === id)?.name ?? "";
}

/** 사용자 폴더 상세에서만 "원래 폴더"가 있다 — 이동 시트가 그 폴더를 미리 골라둔다. */
function toUserFolderId(id?: string): string | undefined {
  return id && /^[1-9]\d*$/.test(id) ? id : undefined;
}

// 화면 가운데 안내 문구 — 없음·빈 목록·에러 상태가 공유한다.
function CenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-background-base px-5">
      {children}
    </View>
  );
}

export function ArchiveDetailScreen() {
  const { id, name } = useLocalSearchParams<{ id?: string; name?: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { show } = useSnackbar();
  const { mutateAsync: deleteLink } = useDeleteLinkMutation();

  const [sort, setSort] = useState<LinkSortOption>("latest");
  // 선택 모드가 아니면 null. 모드 진입 여부와 선택 목록이 한 상태라 둘이 어긋나지 않는다.
  const [selectedIds, setSelectedIds] = useState<number[] | null>(null);
  // 삭제 확인 중인 링크들. null 이면 다이얼로그가 닫힌 상태다.
  const [idsToDelete, setIdsToDelete] = useState<number[] | null>(null);

  const isSelecting = selectedIds !== null;

  const toggleSelection = (linkId: number) => {
    setSelectedIds((current) => {
      if (current === null) return current;
      return current.includes(linkId)
        ? current.filter((selected) => selected !== linkId)
        : [...current, linkId];
    });
  };

  const handleMove = (linkIds: number[]) => {
    router.push(moveLinksHref(linkIds, toUserFolderId(id)));
  };

  const handleShare = async (linkId: number) => {
    try {
      // 목록 응답엔 원문 url 이 없어 상세를 한 번 조회한다(이미 받아둔 게 있으면 캐시가 준다).
      const { url } = await queryClient.fetchQuery(
        linkQueries.detail(String(linkId)),
      );
      const result = await shareUrl(url);
      if (result === "copied") {
        show({ message: "링크 주소를 복사했어요." });
      }
    } catch {
      show({ message: "링크를 공유하지 못했어요. 다시 시도해주세요." });
    }
  };

  const handleConfirmDelete = async () => {
    if (!idsToDelete) {
      return;
    }
    setIdsToDelete(null);

    try {
      // 벌크 API 가 없어 링크마다 보낸다.
      await Promise.all(idsToDelete.map((linkId) => deleteLink(linkId)));
      setSelectedIds(null);
    } catch {
      show({ message: "링크를 삭제하지 못했어요. 다시 시도해주세요." });
    }
  };

  const header = isSelecting ? (
    <Header
      scrollScope="archive-detail"
      title={
        selectedIds.length === 0 ? "선택하기" : `${selectedIds.length}개 선택`
      }
      right={
        <IconButton
          iconNode={Check}
          accessibilityLabel="완료"
          onPress={() => setSelectedIds(null)}
        />
      }
    />
  ) : (
    <Header
      scrollScope="archive-detail"
      left={<HeaderBackButton />}
      title={resolveTitle(id, name)}
      right={
        <>
          <IconButton
            iconNode={Search}
            accessibilityLabel="검색"
            onPress={() => router.navigate(ROUTES.SEARCH)}
          />
          <ArchiveDetailMoreMenu
            sort={sort}
            onSortChange={setSort}
            onSelectMode={() => setSelectedIds([])}
          />
        </>
      }
    />
  );

  return (
    <View className="flex-1">
      <Stack.Screen options={{ header: () => header }} />
      <ArchiveDetailBody
        id={id}
        sort={sort}
        selectedIds={selectedIds}
        onOpenLink={(linkId) => router.push(linkDetailHref(String(linkId)))}
        onToggleSelection={toggleSelection}
        onMove={(linkId) => handleMove([linkId])}
        onShare={handleShare}
        onDelete={(linkId) => setIdsToDelete([linkId])}
      />

      {isSelecting && (
        <SelectionActionBar
          isDisabled={selectedIds.length === 0}
          onMove={() => handleMove(selectedIds)}
          onDelete={() => setIdsToDelete(selectedIds)}
        />
      )}

      <AlertDialog
        isOpen={idsToDelete !== null}
        onClose={() => setIdsToDelete(null)}
        title="링크를 삭제할까요?"
        description="삭제된 링크는 최근 삭제된 항목으로 이동돼요"
        actions={
          <>
            <AlertDialogButton
              label="취소"
              variant="secondary"
              onPress={() => setIdsToDelete(null)}
            />
            <AlertDialogButton
              label="삭제"
              variant="destructive"
              onPress={handleConfirmDelete}
            />
          </>
        }
      />
    </View>
  );
}

interface ArchiveDetailBodyProps {
  id?: string;
  sort: LinkSortOption;
  /** null 이면 선택 모드가 아니다. */
  selectedIds: number[] | null;
  onOpenLink: (linkId: number) => void;
  onToggleSelection: (linkId: number) => void;
  onMove: (linkId: number) => void;
  onShare: (linkId: number) => void;
  onDelete: (linkId: number) => void;
}

function ArchiveDetailBody({ id, sort, ...listProps }: ArchiveDetailBodyProps) {
  // 잘못된 id 는 조회 이전 분기라 경계 밖에 남는다 — useSuspenseQuery 는 끌 수 없어서
  // 여기서 막지 않으면 NaN 파라미터가 서버로 새어나간다.
  if (!isFolderRouteId(id)) {
    return (
      <CenteredMessage>
        <Text variant="body-2-normal" className="text-text-alternative">
          폴더를 찾을 수 없어요.
        </Text>
      </CenteredMessage>
    );
  }

  return (
    <AsyncBoundary
      resetKeys={[id, sort]}
      pending={
        <View className="flex-1 items-center justify-center bg-background-base">
          <ActivityIndicator testID="archive-detail-loading" />
        </View>
      }
      fallback={({ reset }) => (
        <CenteredMessage>
          <Text variant="body-2-normal" className="text-text-alternative">
            링크를 불러오지 못했어요.
          </Text>
          <Pressable accessibilityRole="button" onPress={reset}>
            <Text variant="label-1" className="text-old-icon-accent">
              다시 시도
            </Text>
          </Pressable>
        </CenteredMessage>
      )}
    >
      <ArchiveDetailContent folderId={id} sort={sort} {...listProps} />
    </AsyncBoundary>
  );
}

interface ArchiveDetailContentProps
  extends Omit<ArchiveDetailBodyProps, "id" | "sort"> {
  folderId: string;
  sort: LinkSortOption;
}

function ArchiveDetailContent({
  folderId,
  sort,
  selectedIds,
  onOpenLink,
  onToggleSelection,
  onMove,
  onShare,
  onDelete,
}: ArchiveDetailContentProps) {
  const scrollHandler = useHeaderAwareScrollHandler("archive-detail");
  const { data: links } = useSuspenseQuery(
    folderLinkQueries.list(folderId, sort),
  );

  if (links.length === 0) {
    return <EmptyLinks folderId={folderId} />;
  }

  return (
    <Animated.ScrollView
      className="flex-1 bg-background-base"
      showsVerticalScrollIndicator={false}
      onScroll={scrollHandler}
      scrollEventThrottle={16}
    >
      <View
        className="flex-row flex-wrap justify-between gap-y-5 px-5 pt-2 pb-6"
        // 선택 모드에서는 하단 액션 바가 마지막 줄을 가리지 않도록 여백을 더 준다.
        style={selectedIds !== null ? { paddingBottom: 130 } : undefined}
      >
        {links.map((link, index) => (
          <LinkGridItem
            key={link.linkId}
            link={link}
            // 컨텍스트 메뉴는 눌린 카드가 있는 열 쪽에 붙는다.
            align={index % 2 === 0 ? "start" : "end"}
            selectedIds={selectedIds}
            onOpenLink={onOpenLink}
            onToggleSelection={onToggleSelection}
            onMove={onMove}
            onShare={onShare}
            onDelete={onDelete}
          />
        ))}
      </View>
    </Animated.ScrollView>
  );
}

interface LinkGridItemProps
  extends Omit<ArchiveDetailContentProps, "folderId" | "sort"> {
  link: Link;
  align: "start" | "end";
}

// 선택 모드에서는 탭이 선택 토글이 되고 컨텍스트 메뉴도 열리지 않는다.
function LinkGridItem({
  link,
  align,
  selectedIds,
  onOpenLink,
  onToggleSelection,
  onMove,
  onShare,
  onDelete,
}: LinkGridItemProps) {
  if (selectedIds !== null) {
    return (
      <LinkTile
        link={link}
        isSelected={selectedIds.includes(link.linkId)}
        onPress={() => onToggleSelection(link.linkId)}
      />
    );
  }

  return (
    <LinkContextMenu
      link={link}
      align={align}
      onOpenLink={() => onOpenLink(link.linkId)}
      onMove={() => onMove(link.linkId)}
      onShare={() => onShare(link.linkId)}
      onDelete={() => onDelete(link.linkId)}
    />
  );
}

// Figma "선택하기" 하단 액션 — 콘텐츠가 비쳐 보이도록 배경색으로 페이드하는 딤 위에 얹는다.
const SELECTION_BAR_GRADIENT = [
  "rgba(14, 14, 19, 0)",
  "rgb(14, 14, 19)",
] as const;

interface SelectionActionBarProps {
  isDisabled: boolean;
  onMove: () => void;
  onDelete: () => void;
}

function SelectionActionBar({
  isDisabled,
  onMove,
  onDelete,
}: SelectionActionBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={{ paddingBottom: Math.max(insets.bottom, 20) }}
      className="absolute right-0 bottom-0 left-0 items-center pt-11"
    >
      {/* expo-linear-gradient 는 NativeWind className 을 받지 않아(무시된다) 배경만 style 로 채운다. */}
      <LinearGradient
        colors={SELECTION_BAR_GRADIENT}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      />
      <View className="flex-row gap-2">
        <ActionButton
          size="small"
          className="self-start"
          disabled={isDisabled}
          onPress={onMove}
        >
          폴더 이동
        </ActionButton>
        <ActionButton
          size="small"
          variant="destructive"
          className="self-start"
          disabled={isDisabled}
          onPress={onDelete}
        >
          링크 삭제
        </ActionButton>
      </View>
    </View>
  );
}
