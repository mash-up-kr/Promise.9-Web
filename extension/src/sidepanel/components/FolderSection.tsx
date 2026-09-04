import {
  type FolderListResponse,
  folderQueries,
} from "@shared/entities/folder/folder.queries";
import { useSuspenseQuery } from "@tanstack/react-query";
import clsx from "clsx";

import type React from "react";

import { FolderGlyph } from "./FolderGlyph";

/** 미분류는 실제 폴더 row 가 아니라 `folderId: null` 로 저장하는 조건이다(서버 계약). */
const UNCATEGORIZED_LABEL = "미분류";

export interface FolderSectionProps {
  selectedFolderId: number | null;
  onSelect: (folderId: number | null) => void;
  onCreateFolder: () => void;
}

// 모듈 스코프에 둬야 호출마다 같은 참조라 react-query 가 데이터가 그대로일 때 재계산을 건너뛴다.
const selectFolders = (data: FolderListResponse) => data.folders;

export function FolderSection({
  selectedFolderId,
  onSelect,
  onCreateFolder,
}: FolderSectionProps) {
  const { data: folders } = useSuspenseQuery({
    ...folderQueries.list(),
    select: selectFolders,
  });

  return (
    <FolderSectionFrame onCreateFolder={onCreateFolder}>
      {/* 폴더 수가 많으면 가로로 흐른다 — 패널이 좁아져도 줄바꿈 대신 스크롤로 버틴다. */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        <FolderChip
          label={UNCATEGORIZED_LABEL}
          selected={selectedFolderId === null}
          onClick={() => onSelect(null)}
        />
        {folders.map((folder) => (
          <FolderChip
            key={folder.folderId}
            label={folder.folderName}
            color={folder.color}
            selected={selectedFolderId === folder.folderId}
            onClick={() => onSelect(folder.folderId)}
          />
        ))}
      </div>
    </FolderSectionFrame>
  );
}

export interface FolderSectionFrameProps {
  /** 로딩·실패 상태에서는 새 폴더 버튼을 감춘다(폴더 목록을 모르는 상태라). */
  onCreateFolder?: () => void;
  children: React.ReactNode;
}

/** 폴더 섹션의 껍데기 — 제목·새 폴더 버튼. 로딩·실패 화면도 같은 껍데기를 쓴다. */
export function FolderSectionFrame({
  onCreateFolder,
  children,
}: FolderSectionFrameProps) {
  return (
    <section>
      <header className="flex h-6 items-center justify-between">
        <h2 className="text-heading-3 text-text-strong">폴더</h2>
        {onCreateFolder ? (
          <button
            type="button"
            onClick={onCreateFolder}
            aria-label="새 폴더 만들기"
            className="flex size-6 items-center justify-center rounded-full text-icon-accent hover:bg-state-hover"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden
            >
              <path
                d="M10 4.5v11M4.5 10h11"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        ) : null}
      </header>
      <div className="mt-3">{children}</div>
    </section>
  );
}

interface FolderChipProps {
  label: string;
  color?: string;
  selected: boolean;
  onClick: () => void;
}

function FolderChip({ label, color, selected, onClick }: FolderChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={clsx(
        "flex h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-body-2-normal",
        selected
          ? "bg-background-list-selected text-text-strong"
          : "bg-background-list text-text-alternative hover:bg-background-list-selected",
      )}
    >
      <FolderGlyph color={color} />
      {label}
    </button>
  );
}
