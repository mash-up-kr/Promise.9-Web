import { useSuspenseQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { AsyncBoundary } from "@/components/ui/async-boundary/AsyncBoundary";
import { BottomSheetHeader } from "@/components/ui/bottom-sheet/BottomSheetHeader";
import { useSheetDismiss } from "@/components/ui/bottom-sheet/useSheetDismiss";
import { SheetScreen } from "@/components/ui/sheet-screen/SheetScreen";
import { useSnackbar } from "@/components/ui/snackbar/SnackbarProvider";
import { snackbarPresets } from "@/components/ui/snackbar/snackbar.presets";
import { Spinner } from "@/components/ui/spinner/Spinner";
import { Text } from "@/components/ui/text/Text";
import { useUpdateLinkFolderMutation } from "@/features/link/api/link.queries";

import { folderQueries } from "./api/folder.queries";
import { UNCATEGORIZED_FOLDER } from "./archive.constants";
import type { ArchiveFolder } from "./archive.types";
import { FolderGroup } from "./components/FolderGroup";
import { FolderSection } from "./components/FolderSection";
import { FolderSelectItem } from "./components/FolderSelectItem";

/**
 * 링크를 다른 폴더로 옮기는 바텀시트 (Figma "archive-detail / folder-move").
 *
 * 대상 링크는 라우트 파라미터 `ids`(쉼표 구분)로 받는다 — 컨텍스트 메뉴의 한 개도,
 * 선택 모드의 여러 개도 같은 시트를 쓴다. 서버에 벌크 이동 API 가 없어 링크마다 PATCH 한다.
 */
export function MoveLinksSheet() {
  const router = useRouter();

  const closeSheet = () => {
    // 웹에서 히스토리가 없으면(직접 진입 등) back 이 실패하므로 홈으로 대체한다.
    if (router.canGoBack()) {
      router.back();

      return;
    }
    router.replace("/");
  };

  return (
    <SheetScreen onClose={closeSheet}>
      <MoveLinksSheetBody />
    </SheetScreen>
  );
}

// 취소·저장은 라우트를 바로 제거하지 않고 시트 닫힘 애니메이션을 거친다
// (useSheetDismiss 는 시트 자손에서만 쓸 수 있어 본문을 분리).
function MoveLinksSheetBody() {
  const dismiss = useSheetDismiss();
  const router = useRouter();
  const { show } = useSnackbar();
  const { mutateAsync: moveLink } = useUpdateLinkFolderMutation();

  const { ids, folderId } = useLocalSearchParams<{
    ids?: string;
    folderId?: string;
  }>();
  const linkIds = parseLinkIds(ids);

  // 목적지 폴더(보관함 라우트 id). 링크가 원래 있던 폴더를 미리 골라둔 채로 연다.
  const [targetFolderId, setTargetFolderId] = useState<string | null>(
    folderId ?? null,
  );
  const [isMoving, setIsMoving] = useState(false);

  const handleSave = async (folders: ArchiveFolder[]) => {
    const target = findTargetFolder(folders, targetFolderId);
    if (!target || isMoving) {
      return;
    }

    setIsMoving(true);
    try {
      // 벌크 API 가 없어 링크마다 보낸다. 하나라도 실패하면 시트를 열어둔 채 재시도하게 한다.
      await Promise.all(
        linkIds.map((linkId) =>
          moveLink({ linkId, folderId: toRequestFolderId(target.id) }),
        ),
      );
      show(
        snackbarPresets.success(`${target.name}에 저장됨`, () =>
          router.push({
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

  // 폴더 목록을 기다리는 동안에도 취소는 눌려야 하므로 저장만 잠근 헤더를 함께 보여준다.
  const placeholderHeader = (
    <BottomSheetHeader
      title="폴더 이동"
      onCancel={dismiss}
      onConfirm={() => {}}
      isConfirmDisabled
    />
  );

  return (
    <AsyncBoundary
      pending={
        <>
          {placeholderHeader}
          <PickerPlaceholder>
            <Spinner size="medium" />
          </PickerPlaceholder>
        </>
      }
      fallback={
        <>
          {placeholderHeader}
          <PickerPlaceholder>
            <Text variant="body-2-normal" className="text-text-alternative">
              폴더를 불러오지 못했어요.
            </Text>
          </PickerPlaceholder>
        </>
      }
    >
      <FolderPicker
        selectedFolderId={targetFolderId}
        isMoving={isMoving}
        onSelect={setTargetFolderId}
        onCancel={dismiss}
        onSave={handleSave}
        onAddFolder={() => router.push("/create-folder")}
      />
    </AsyncBoundary>
  );
}

interface FolderPickerProps {
  selectedFolderId: string | null;
  isMoving: boolean;
  onSelect: (folderId: string) => void;
  onCancel: () => void;
  onSave: (folders: ArchiveFolder[]) => void;
  onAddFolder: () => void;
}

function FolderPicker({
  selectedFolderId,
  isMoving,
  onSelect,
  onCancel,
  onSave,
  onAddFolder,
}: FolderPickerProps) {
  const { data } = useSuspenseQuery(folderQueries.list());

  return (
    <>
      <BottomSheetHeader
        title="폴더 이동"
        onCancel={onCancel}
        onConfirm={() => onSave(data.myFolders)}
        isConfirmDisabled={selectedFolderId === null || isMoving}
      />
      {/* 시트가 이미 가로 여백을 가져 섹션은 여백 없이 붙인다. */}
      <FolderSection title="기본 폴더" className="gap-3">
        <FolderGroup>
          <FolderSelectItem
            name={UNCATEGORIZED_FOLDER.name}
            isSelected={selectedFolderId === UNCATEGORIZED_FOLDER.id}
            onPress={() => onSelect(UNCATEGORIZED_FOLDER.id)}
          />
        </FolderGroup>
      </FolderSection>
      <FolderSection
        title="내 폴더"
        className="gap-3"
        action={{ label: "새 폴더 만들기", onPress: onAddFolder }}
      >
        <FolderGroup>
          {data.myFolders.map((folder) => (
            <FolderSelectItem
              key={folder.id}
              name={folder.name}
              tone={folder.tone}
              isSelected={selectedFolderId === folder.id}
              onPress={() => onSelect(folder.id)}
            />
          ))}
        </FolderGroup>
      </FolderSection>
    </>
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
