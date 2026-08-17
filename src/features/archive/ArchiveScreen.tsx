import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Check, Search } from "lucide-react-native";
import { type ReactNode, useCallback, useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  useAnimatedRef,
  useScrollOffset,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  AlertDialog,
  AlertDialogButton,
} from "@/components/ui/alert-dialog/AlertDialog";
import { AsyncBoundary } from "@/components/ui/async-boundary/AsyncBoundary";
import { Header } from "@/components/ui/header/Header";
import { useHeaderAwareScrollHandler } from "@/components/ui/header/useHeaderAwareScrollHandler";
import { IconButton } from "@/components/ui/icon-button/IconButton";
import { useSnackbar } from "@/components/ui/snackbar/SnackbarProvider";
import { Text } from "@/components/ui/text/Text";
import {
  folderQueries,
  useDeleteFolderMutation,
  useReorderFoldersMutation,
} from "./api/folder.queries";
import { SYSTEM_FOLDERS } from "./archive.constants";
import type { ArchiveFolder, SystemFolderKey } from "./archive.types";
import { applyFolderOrder } from "./archive.utils";
import { ArchiveMoreMenu } from "./components/ArchiveMoreMenu";
import { FolderContextMenu } from "./components/FolderContextMenu";
import { FolderGroup } from "./components/FolderGroup";
import { FolderItem } from "./components/FolderItem";
import { FolderListSkeleton } from "./components/FolderListSkeleton";
import { FolderSection } from "./components/FolderSection";
import { NewFolderButton } from "./components/NewFolderButton";
import { SortableFolderList } from "./components/SortableFolderList";
import { isFolderOrderMismatchError } from "./folder.errors";

type OpenFolderHandler = (id: string, name: string) => void;

export function ArchiveScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // 하단 플로팅 탭바(pill 높이 60 + safe-area 여백)에 가리지 않도록 스크롤 하단 여백을 준다.
  const listBottomPadding = Math.max(insets.bottom, 20) + 60 + 16;

  const { show } = useSnackbar();
  const { mutate: saveOrder } = useReorderFoldersMutation();
  const { mutate: deleteFolder } = useDeleteFolderMutation();

  // 삭제 확인 중인 폴더. null 이면 다이얼로그가 닫힌 상태다.
  const [folderToDelete, setFolderToDelete] = useState<ArchiveFolder | null>(
    null,
  );

  // 헤더가 경계 밖이라 편집 모드·편집 중 순서는 여기서 들고 있는다(완료 버튼이 헤더에 있다).
  const [isReordering, setIsReordering] = useState(false);
  // 드래그로 바뀐 순서(id). 편집 세션 동안만 유지하고, 저장·취소 후엔 비워 서버 순서를 따른다.
  const [orderedIds, setOrderedIds] = useState<string[]>([]);

  const finishReordering = useCallback(() => {
    setIsReordering(false);

    // 드래그를 안 했으면 보낼 변경이 없다 — 서버 순서 그대로다.
    if (orderedIds.length === 0) {
      return;
    }

    saveOrder(orderedIds, {
      onError: (error) => {
        show({
          message: isFolderOrderMismatchError(error)
            ? "폴더 목록이 변경되어 순서를 저장하지 못했어요."
            : "폴더 순서를 저장하지 못했어요. 다시 시도해주세요.",
        });
      },
      // 성공하면 재조회 결과가, 실패하면 기존 서버 순서가 정답이므로 어느 쪽이든 로컬 순서를
      // 버린다. 응답 전에 버리면 그 사이 낡은 서버 순서가 잠깐 보였다가 다시 튄다.
      onSettled: () => setOrderedIds([]),
    });
  }, [orderedIds, saveOrder, show]);

  const handleOpenFolder = useCallback<OpenFolderHandler>(
    (id, name) => {
      // 상세 헤더 타이틀로 쓰도록 폴더명도 함께 넘긴다.
      router.push({ pathname: "/archive/[id]", params: { id, name } });
    },
    [router],
  );

  const handleAddFolder = useCallback(() => {
    router.push("/create-folder");
  }, [router]);

  // 목록이 이미 이름·색을 갖고 있어 편집 시트가 상세를 다시 조회하지 않도록 함께 넘긴다.
  const handleEditFolder = useCallback(
    (folder: ArchiveFolder) => {
      router.push({
        pathname: "/edit-folder",
        params: { id: folder.id, name: folder.name, color: folder.tone },
      });
    },
    [router],
  );

  const handleConfirmDelete = useCallback(() => {
    if (!folderToDelete) {
      return;
    }
    deleteFolder(folderToDelete.id, {
      onError: () =>
        show({ message: "폴더를 삭제하지 못했어요. 다시 시도해주세요." }),
    });
    setFolderToDelete(null);
  }, [deleteFolder, folderToDelete, show]);

  const headerRight = isReordering ? (
    <IconButton
      iconNode={Check}
      accessibilityLabel="완료"
      onPress={finishReordering}
    />
  ) : (
    <>
      <IconButton
        iconNode={Search}
        accessibilityLabel="검색"
        onPress={() => router.navigate("/search")}
      />
      <ArchiveMoreMenu
        onCreateFolder={handleAddFolder}
        onEditOrder={() => setIsReordering(true)}
      />
    </>
  );

  return (
    <View className="flex-1 bg-background-base">
      <Header scrollScope="archive" title="보관함" right={headerRight} />
      <AsyncBoundary
        // 기본 폴더는 이름·순서가 고정이라 응답을 기다리지 않고 그대로 보여주고,
        // 서버에서 오는 링크 수와 내 폴더 목록만 스켈레톤으로 채운다.
        pending={
          <ArchiveScrollBody bottomPadding={listBottomPadding}>
            <BasicFolderSection onOpenFolder={handleOpenFolder} />
            <FolderSection title="내 폴더">
              <FolderListSkeleton />
            </FolderSection>
          </ArchiveScrollBody>
        }
        fallback={({ reset }) => (
          <View className="flex-1 items-center justify-center gap-3 px-5">
            <Text variant="body-2-normal" className="text-text-alternative">
              폴더를 불러오지 못했어요.
            </Text>
            <Pressable accessibilityRole="button" onPress={reset}>
              <Text variant="label-1" className="text-icon-accent">
                다시 시도
              </Text>
            </Pressable>
          </View>
        )}
      >
        <ArchiveFolders
          isReordering={isReordering}
          orderedIds={orderedIds}
          onReorder={setOrderedIds}
          bottomPadding={listBottomPadding}
          onOpenFolder={handleOpenFolder}
          onAddFolder={handleAddFolder}
          onEditFolder={handleEditFolder}
          onDeleteFolder={setFolderToDelete}
        />
      </AsyncBoundary>

      <AlertDialog
        isOpen={folderToDelete !== null}
        onClose={() => setFolderToDelete(null)}
        title="폴더를 삭제하시겠어요?"
        description="저장된 링크는 미분류 폴더로 이동돼요"
        actions={
          <>
            <AlertDialogButton
              label="취소"
              variant="secondary"
              onPress={() => setFolderToDelete(null)}
            />
            <AlertDialogButton
              label="폴더 삭제"
              variant="destructive"
              onPress={handleConfirmDelete}
            />
          </>
        }
      />
    </View>
  );
}

interface ArchiveFoldersProps {
  isReordering: boolean;
  /** 편집 중 순서(id). 비어 있으면 서버 순서를 그대로 쓴다. */
  orderedIds: string[];
  onReorder: (orderedIds: string[]) => void;
  bottomPadding: number;
  onOpenFolder: OpenFolderHandler;
  onAddFolder: () => void;
  onEditFolder: (folder: ArchiveFolder) => void;
  onDeleteFolder: (folder: ArchiveFolder) => void;
}

function ArchiveFolders({
  isReordering,
  orderedIds,
  onReorder,
  bottomPadding,
  onOpenFolder,
  onAddFolder,
  onEditFolder,
  onDeleteFolder,
}: ArchiveFoldersProps) {
  const { data } = useSuspenseQuery(folderQueries.list());

  // 서버 데이터를 복사하지 않고 순서(id)만 들고 있다가 렌더 시 적용한다. 편집 중 재조회가
  // 일어나도 사용자가 드래그한 순서가 유지되고, 저장 후엔 순서를 비워 서버 값이 정답이 된다.
  const myFolders = useMemo(
    () => applyFolderOrder(data.myFolders, orderedIds),
    [data.myFolders, orderedIds],
  );

  // 드래그 중에는 바깥 ScrollView 스크롤을 끄고, 자동 스크롤(scrollTo)만 동작시킨다.
  const [isDragging, setIsDragging] = useState(false);
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollOffset(scrollRef);
  const scrollContentHeight = useSharedValue(0);

  // 드래그 제스처가 매 렌더마다 재생성되지 않도록 안정된 참조로 유지한다
  // (SortableFolderItem 의 gesture useMemo 가 이 콜백에 의존한다).
  const handleReorder = useCallback(
    (next: ArchiveFolder[]) => {
      onReorder(next.map((folder) => folder.id));
    },
    [onReorder],
  );

  // 편집 모드에선 기본 폴더를 읽기 전용(탭 비활성)으로 헤더에 재사용한다.
  const basicSection = (
    <BasicFolderSection
      counts={data.systemFolderCounts}
      onOpenFolder={isReordering ? undefined : onOpenFolder}
    />
  );

  if (isReordering) {
    return (
      <Animated.ScrollView
        ref={scrollRef}
        scrollEnabled={!isDragging}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={(_width, height) => {
          scrollContentHeight.value = height;
        }}
      >
        <View className="gap-12 pt-5" style={{ paddingBottom: bottomPadding }}>
          {basicSection}
          <FolderSection
            title="내 폴더"
            action={{ label: "폴더 추가", onPress: onAddFolder }}
          >
            <SortableFolderList
              folders={myFolders}
              onReorder={handleReorder}
              scrollRef={scrollRef}
              scrollOffset={scrollOffset}
              scrollContentHeight={scrollContentHeight}
              onDraggingChange={setIsDragging}
            />
          </FolderSection>
        </View>
      </Animated.ScrollView>
    );
  }

  return (
    <ArchiveScrollBody bottomPadding={bottomPadding}>
      {basicSection}
      <FolderSection
        title="내 폴더"
        action={
          myFolders.length > 0
            ? { label: "폴더 추가", onPress: onAddFolder }
            : undefined
        }
      >
        {myFolders.length === 0 ? (
          <NewFolderButton onPress={onAddFolder} />
        ) : (
          <FolderGroup>
            {myFolders.map((folder) => (
              <FolderContextMenu
                key={folder.id}
                folder={folder}
                onOpenFolder={() => onOpenFolder(folder.id, folder.name)}
                onEdit={() => onEditFolder(folder)}
                onDelete={() => onDeleteFolder(folder)}
              />
            ))}
          </FolderGroup>
        )}
      </FolderSection>
    </ArchiveScrollBody>
  );
}

/** 기본 폴더 섹션. `counts` 가 없으면(로딩 중) 링크 수 자리는 스켈레톤이 된다. */
function BasicFolderSection({
  counts,
  onOpenFolder,
}: {
  counts?: Record<SystemFolderKey, number>;
  onOpenFolder?: OpenFolderHandler;
}) {
  return (
    <FolderSection title="기본 폴더">
      <FolderGroup>
        {SYSTEM_FOLDERS.map((folder) => (
          <FolderItem
            key={folder.id}
            name={folder.name}
            count={counts?.[folder.countKey]}
            onPress={
              onOpenFolder
                ? () => onOpenFolder(folder.id, folder.name)
                : undefined
            }
          />
        ))}
      </FolderGroup>
    </FolderSection>
  );
}

/** 로딩·일반 모드가 공유하는 스크롤 본문 껍데기. */
function ArchiveScrollBody({
  bottomPadding,
  children,
}: {
  bottomPadding: number;
  children: ReactNode;
}) {
  // 정렬 편집 모드 스크롤러는 드래그 자동 스크롤 전용이라 헤더 연동은 일반 모드에만 건다.
  const scrollHandler = useHeaderAwareScrollHandler("archive");

  return (
    <Animated.ScrollView
      showsVerticalScrollIndicator={false}
      onScroll={scrollHandler}
      scrollEventThrottle={16}
    >
      <View className="gap-12 pt-5" style={{ paddingBottom: bottomPadding }}>
        {children}
      </View>
    </Animated.ScrollView>
  );
}
