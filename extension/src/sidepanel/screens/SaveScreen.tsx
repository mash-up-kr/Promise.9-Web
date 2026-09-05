import { useEffect, useState } from "react";

import type { ActiveTab } from "@/lib/activeTab";
import type { SaveLinkPayload } from "@/lib/messages";
import { isPast, toReminderAt } from "@/lib/remind";
import { ActionButton } from "@/sidepanel/components/ActionButton";
import { AsyncBoundary } from "@/sidepanel/components/AsyncBoundary";
import { EnterHint } from "@/sidepanel/components/EnterHint";
import {
  FolderSection,
  FolderSectionFrame,
} from "@/sidepanel/components/FolderSection";
import { LinkCard } from "@/sidepanel/components/LinkCard";
import { MemoField } from "@/sidepanel/components/MemoField";
import { RemindSection } from "@/sidepanel/components/RemindSection";
import { useEnterShortcut } from "@/sidepanel/hooks/useEnterShortcut";

export interface SaveScreenProps {
  tab: ActiveTab;
  /** 저장 가능하다고 이미 판정된 URL. */
  url: string;
  folderId: number | null;
  onFolderChange: (folderId: number | null) => void;
  memo: string;
  onMemoChange: (memo: string) => void;
  /** null 이면 리마인드를 끈 상태. */
  reminderAt: Date | null;
  onReminderChange: (value: Date | null) => void;
  onPickDate: () => void;
  onPickTime: () => void;
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
  reminderAt,
  onReminderChange,
  onPickDate,
  onPickTime,
  isSaving,
  onSave,
  onCreateFolder,
}: SaveScreenProps) {
  const [showsPastWarning, setShowsPastWarning] = useState(false);

  const save = () => {
    if (isSaving) return;

    // 서버는 미래 시각만 받는다(reminderAt). 요청을 보내 400 을 받기 전에 여기서 막고,
    // 시안대로 Footer 위에 인라인으로 알린다.
    if (reminderAt && isPast(reminderAt, new Date())) {
      setShowsPastWarning(true);
      return;
    }

    setShowsPastWarning(false);
    onSave({
      url,
      folderId,
      memo: memo.trim() || null,
      reminderAt: reminderAt ? toReminderAt(reminderAt) : null,
    });
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
        <RemindSection
          value={reminderAt}
          now={new Date()}
          onChange={(next) => {
            setShowsPastWarning(false);
            onReminderChange(next);
          }}
          onPickDate={onPickDate}
          onPickTime={onPickTime}
        />
        <MemoField value={memo} onChange={onMemoChange} className="flex-1" />
      </div>

      {showsPastWarning ? (
        <PastTimeWarning onDismiss={() => setShowsPastWarning(false)} />
      ) : null}

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

/**
 * 지난 시각으로 저장하려 할 때의 인라인 안내(시안 `popup (time-past-toast)`).
 *
 * 4초 뒤 스스로 사라진다 — 사용자가 날짜나 시간을 고치면 그 즉시 사라지기도 한다.
 */
function PastTimeWarning({ onDismiss }: { onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <p
      role="alert"
      className="flex items-center gap-2 bg-background-list px-4 py-3 text-body-3 text-text-normal"
    >
      <span aria-hidden className="text-action-destructive">
        <WarningIcon />
      </span>
      선택한 시간이 이미 지났어요. 날짜나 시간을 변경해 주세요.
    </p>
  );
}

function WarningIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="7" fill="currentColor" />
      <path
        d="M8 4.5v4M8 11.2v.3"
        stroke="var(--color-text-inverse)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
