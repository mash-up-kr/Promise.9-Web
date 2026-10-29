import { AsyncBoundary } from "@promise9/ui/async-boundary/AsyncBoundary";
import { ListGroup } from "@promise9/ui/list-group/ListGroup";
import { ListSection } from "@promise9/ui/list-section/ListSection";
import { Spinner } from "@promise9/ui/spinner/Spinner";
import { Text } from "@promise9/ui/text/Text";
import { folderQueries } from "@shared/entities/folder/folder.queries";
import { useMoveLinksToFolderMutation } from "@shared/entities/link/link.queries";
import { useSuspenseQuery } from "@tanstack/react-query";
import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { BottomSheetHeader } from "@/components/ui/bottom-sheet/BottomSheetHeader";
import { useSheetDismiss } from "@/components/ui/bottom-sheet/useSheetDismiss";
import { SheetScreen } from "@/components/ui/sheet-screen/SheetScreen";
import { useSheetRouteNavigation } from "@/components/ui/sheet-screen/useSheetRouteNavigation";
import { useSnackbar } from "@/components/ui/snackbar/SnackbarProvider";
import { snackbarPresets } from "@/components/ui/snackbar/snackbar.presets";
import { UNCATEGORIZED_FOLDER } from "./archive.constants";
import type { ArchiveFolder } from "./archive.types";
import { toArchiveFolderData } from "./archive.utils";
import { FolderSelectItem } from "./components/FolderSelectItem";

/**
 * 링크를 다른 폴더로 옮기는 바텀시트 (Figma "archive-detail / folder-move").
 *
 * 대상 링크는 라우트 파라미터 `ids`(쉼표 구분)로 받는다 — 컨텍스트 메뉴의 한 개도,
 * 선택 모드의 여러 개도 같은 시트를 쓴다. 이동은 일괄 API 한 번으로 처리한다.
 */
export function MoveLinksSheet() {
  const { closeSheet, navigateFromSheet } = useSheetRouteNavigation();
  const router = useRouter();
  const { ids, folderId, title } = useLocalSearchParams<{
    ids?: string;
    folderId?: string;
    title?: string;
  }>();

  // 목적지 폴더(보관함 라우트 id). 링크가 원래 있던 폴더를 미리 골라둔 채로 연다.
  const [targetFolderId, setTargetFolderId] = useState<string | null>(
    folderId ?? null,
  );

  return (
    <SheetScreen
      onClose={closeSheet}
      header={
        <MoveLinksSheetHeader
          // 진입에 따라 타이틀이 다르다 — 링크 상세 "폴더선택"은 "폴더 선택", 그 외는 "폴더 이동".
          title={title ?? "폴더 이동"}
          linkIds={parseLinkIds(ids)}
          targetFolderId={targetFolderId}
          navigateFromSheet={navigateFromSheet}
        />
      }
    >
      <AsyncBoundary
        pending={
          <PickerPlaceholder>
            <Spinner size="medium" />
          </PickerPlaceholder>
        }
        fallback={
          <PickerPlaceholder>
            <Text variant="body-2-normal" className="text-text-alternative">
              폴더를 불러오지 못했어요.
            </Text>
          </PickerPlaceholder>
        }
      >
        <FolderPicker
          selectedFolderId={targetFolderId}
          onSelect={setTargetFolderId}
          onAddFolder={() => router.push("/create-folder")}
        />
      </AsyncBoundary>
    </SheetScreen>
  );
}

interface MoveLinksSheetHeaderProps {
  title: string;
  linkIds: number[];
  targetFolderId: string | null;
  navigateFromSheet: (href: Href) => void;
}

// 취소·저장은 라우트를 바로 제거하지 않고 시트 닫힘 애니메이션을 거친다
// (useSheetDismiss 는 시트 자손에서만 쓸 수 있어 헤더를 분리).
function MoveLinksSheetHeader({
  title,
  linkIds,
  targetFolderId,
  navigateFromSheet,
}: MoveLinksSheetHeaderProps) {
  const dismiss = useSheetDismiss();
  const { show } = useSnackbar();
  const { mutateAsync: moveLinks } = useMoveLinksToFolderMutation();
  const [isMoving, setIsMoving] = useState(false);

  // 옮길 링크가 없으면(ids 파라미터가 없거나 망가진 경우) 저장은 아무것도 하지 않는다 —
  // 그대로 두면 PATCH 는 한 건도 없이 "저장됨" 스낵바만 뜬다.
  const isSaveDisabled = isMoving || linkIds.length === 0;

  const handleSave = async (folders: ArchiveFolder[]) => {
    const target = findTargetFolder(folders, targetFolderId);
    if (!target || isSaveDisabled) {
      return;
    }

    setIsMoving(true);
    try {
      // 서버가 한 transaction 으로 전부 옮기거나 전부 실패시키므로, 실패하면 시트를 열어둔
      // 채 그대로 다시 보내면 된다(일부만 옮겨진 상태가 남지 않는다).
      await moveLinks({ linkIds, folderId: toRequestFolderId(target.id) });
      show(
        snackbarPresets.success(`${target.name}에 저장됨`, () =>
          navigateFromSheet({
            pathname: "/archive/[id]",
            params: { id: target.id, name: target.name },
          }),
        ),
      );
      dismiss();
    } catch {
      show({ message: "링크를 옮기지 못했어요. 다시 시도해주세요." });
    } finally {
      setIsMoving(false);
    }
  };

  // 폴더 목록을 기다리는 동안에도 취소는 눌려야 하므로 저장만 잠근 헤더를 보여준다.
  const placeholderHeader = (
    <BottomSheetHeader
      title={title}
      onCancel={dismiss}
      onConfirm={() => {}}
      isConfirmDisabled
    />
  );

  return (
    // 시안 folder-move 는 헤더→본문 24(다른 시트는 20) — 본문 pt-5 에 4 를 더한다.
    <View className="bg-gray-900 pb-1">
      <AsyncBoundary pending={placeholderHeader} fallback={placeholderHeader}>
        <ReadyHeader
          title={title}
          isConfirmDisabled={targetFolderId === null || isSaveDisabled}
          onCancel={dismiss}
          onSave={handleSave}
        />
      </AsyncBoundary>
    </View>
  );
}

interface ReadyHeaderProps {
  title: string;
  isConfirmDisabled: boolean;
  onCancel: () => void;
  onSave: (folders: ArchiveFolder[]) => void;
}

function ReadyHeader({
  title,
  isConfirmDisabled,
  onCancel,
  onSave,
}: ReadyHeaderProps) {
  const { data } = useSuspenseQuery({
    ...folderQueries.list(),
    select: toArchiveFolderData,
  });

  return (
    <BottomSheetHeader
      title={title}
      onCancel={onCancel}
      onConfirm={() => onSave(data.myFolders)}
      isConfirmDisabled={isConfirmDisabled}
    />
  );
}

interface FolderPickerProps {
  selectedFolderId: string | null;
  onSelect: (folderId: string) => void;
  onAddFolder: () => void;
}

function FolderPicker({
  selectedFolderId,
  onSelect,
  onAddFolder,
}: FolderPickerProps) {
  const { data } = useSuspenseQuery({
    ...folderQueries.list(),
    select: toArchiveFolderData,
  });

  return (
    <View className="gap-12">
      {/* 시트가 이미 가로 여백을 가져 섹션은 여백 없이 붙인다. */}
      <ListSection title="기본 폴더" inset={false}>
        <ListGroup>
          <FolderSelectItem
            name={UNCATEGORIZED_FOLDER.name}
            isSelected={selectedFolderId === UNCATEGORIZED_FOLDER.id}
            onPress={() => onSelect(UNCATEGORIZED_FOLDER.id)}
          />
        </ListGroup>
      </ListSection>
      <ListSection
        title="내 폴더"
        inset={false}
        action={{ label: "새 폴더 만들기", onPress: onAddFolder }}
      >
        <ListGroup>
          {data.myFolders.map((folder) => (
            <FolderSelectItem
              key={folder.id}
              name={folder.name}
              tone={folder.tone}
              isSelected={selectedFolderId === folder.id}
              onPress={() => onSelect(folder.id)}
            />
          ))}
        </ListGroup>
      </ListSection>
    </View>
  );
}

// 로딩·에러 자리 — 헤더 없이 본문만 비므로 최소 높이를 잡아 시트가 튀지 않게 한다.
function PickerPlaceholder({ children }: { children: React.ReactNode }) {
  return (
    <View className="h-40 items-center justify-center gap-3">{children}</View>
  );
}

/** `ids` 파라미터("42,43") → 링크 id 목록. 숫자가 아닌 값은 버린다. */
function parseLinkIds(ids?: string): number[] {
  if (!ids) {
    return [];
  }
  return ids
    .split(",")
    .map(Number)
    .filter((id) => Number.isInteger(id) && id > 0);
}

/** 선택된 라우트 id 로 목적지 폴더(표시명 포함)를 찾는다. 미분류는 서버 폴더가 아니라 상수다. */
function findTargetFolder(
  myFolders: ArchiveFolder[],
  selectedFolderId: string | null,
): { id: string; name: string } | undefined {
  if (selectedFolderId === null) {
    return undefined;
  }
  if (selectedFolderId === UNCATEGORIZED_FOLDER.id) {
    return UNCATEGORIZED_FOLDER;
  }
  return myFolders.find((folder) => folder.id === selectedFolderId);
}

/** 보관함 라우트 id → PATCH /links 의 folderId. 미분류는 null 이 "폴더 없음"을 뜻한다. */
function toRequestFolderId(folderId: string): number | null {
  return folderId === UNCATEGORIZED_FOLDER.id ? null : Number(folderId);
}
