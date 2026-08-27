import type { ActiveTab } from "@/lib/activeTab";
import type { SaveLinkPayload } from "@/lib/messages";
import { ActionButton } from "@/sidepanel/components/ActionButton";
import { AsyncBoundary } from "@/sidepanel/components/AsyncBoundary";
import { EnterHint } from "@/sidepanel/components/EnterHint";
import {
  FolderSection,
  FolderSectionFrame,
} from "@/sidepanel/components/FolderSection";
import { LinkCard } from "@/sidepanel/components/LinkCard";
import { MemoField } from "@/sidepanel/components/MemoField";
import { useEnterShortcut } from "@/sidepanel/hooks/useEnterShortcut";

export interface SaveScreenProps {
  tab: ActiveTab;
  /** 저장 가능하다고 이미 판정된 URL. */
  url: string;
  folderId: number | null;
  onFolderChange: (folderId: number | null) => void;
  memo: string;
  onMemoChange: (memo: string) => void;
  isSaving: boolean;
  onSave: (payload: SaveLinkPayload) => void;
  onCreateFolder: () => void;
}

/** 시안 `chrome-extension / popup` — 카드 + 폴더 + 메모 + 하단 고정 Footer. */
export function SaveScreen({
  tab,
  url,
  folderId,
  onFolderChange,
  memo,
  onMemoChange,
  isSaving,
  onSave,
  onCreateFolder,
}: SaveScreenProps) {
  const save = () => {
    if (isSaving) return;
    onSave({ url, folderId, memo: memo.trim() || null });
  };

  useEnterShortcut(save, !isSaving);

  return (
    // 패널 높이를 꽉 채우고, 넘치는 본문만 스크롤한다 — Footer 는 항상 바닥에 붙어 있다.
    <div className="flex h-full flex-col">
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
        <LinkCard tab={tab} />
        <AsyncBoundary
          pending={<FolderSectionPending />}
          rejected={(retry) => <FolderSectionRejected onRetry={retry} />}
        >
          <FolderSection
            selectedFolderId={folderId}
            onSelect={onFolderChange}
            onCreateFolder={onCreateFolder}
          />
        </AsyncBoundary>
        {/* 남는 세로 공간은 메모가 가져간다 — 패널 아래가 비어 보이지 않게. */}
        <MemoField value={memo} onChange={onMemoChange} className="flex-1" />
      </div>

      <footer className="border-border-divider border-t p-4">
        <ActionButton onClick={save} disabled={isSaving}>
          {isSaving ? "저장 중…" : "저장"}
        </ActionButton>
        <EnterHint />
      </footer>
    </div>
  );
}

function FolderSectionPending() {
  return (
    <FolderSectionFrame>
      <div className="flex gap-2">
        <div className="h-11 w-20 animate-pulse rounded-full bg-background-list" />
        <div className="h-11 w-24 animate-pulse rounded-full bg-background-list" />
      </div>
    </FolderSectionFrame>
  );
}

/**
 * 폴더를 못 불러와도 저장 자체는 막지 않는다 — 폴더 없이(미분류) 저장하면 된다.
 * 그래서 이 자리에서만 실패를 알리고 다시 시도할 수 있게 한다.
 */
function FolderSectionRejected({ onRetry }: { onRetry: () => void }) {
  return (
    <FolderSectionFrame>
      <div className="flex items-center justify-between gap-3">
        <p className="text-body-3 text-text-alternative">
          폴더를 불러오지 못했어요. 미분류로 저장할 수 있어요.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 rounded-full bg-background-list px-3 py-1.5 text-body-3 text-text-normal hover:bg-background-list-selected"
        >
          다시 시도
        </button>
      </div>
    </FolderSectionFrame>
  );
}
