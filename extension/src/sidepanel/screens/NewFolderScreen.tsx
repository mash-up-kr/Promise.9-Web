import { isDuplicateFolderNameError } from "@shared/entities/folder/folder.errors";
import { useCreateFolderMutation } from "@shared/entities/folder/folder.queries";
import {
  FOLDER_COLOR_OPTIONS,
  FOLDER_TONE_HEX,
  type SelectableFolderColor,
} from "@shared/folder/folder.constants";
import {
  createFolderSchema,
  FOLDER_NAME_MAX_LENGTH,
} from "@shared/folder/folder.contracts";
import clsx from "clsx";
import { useState } from "react";

import { ActionButton } from "@/sidepanel/components/ActionButton";

const COLUMNS = 6;
// Figma 그리드는 6열 고정이라 wrap 에 맡기지 않고 행을 직접 나눈다.
const COLOR_ROWS = [
  FOLDER_COLOR_OPTIONS.slice(0, COLUMNS),
  FOLDER_COLOR_OPTIONS.slice(COLUMNS),
];

export interface NewFolderScreenProps {
  onCancel: () => void;
  /** 생성된 폴더를 저장 화면에서 곧바로 선택 상태로 만든다(시안 정책). */
  onCreated: (folderId: number) => void;
}

/** 시안 `chrome-extension / new folder`. */
export function NewFolderScreen({ onCancel, onCreated }: NewFolderScreenProps) {
  const [folderName, setFolderName] = useState("");
  const [color, setColor] = useState<SelectableFolderColor>(
    FOLDER_COLOR_OPTIONS[0],
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createFolder = useCreateFolderMutation();
  // 이름 규칙은 앱·웹의 폼과 같은 스키마를 쓴다 — 여기서만 통과하는 이름이 있으면
  // 웹의 폼으로는 고칠 수 없는 폴더가 생긴다.
  const parsed = createFolderSchema.safeParse({ folderName, color });

  const submit = () => {
    if (!parsed.success || createFolder.isPending) return;

    setErrorMessage(null);
    createFolder.mutate(parsed.data, {
      onSuccess: (created) => onCreated(created.folderId),
      onError: (error) => {
        // 서버 계약 판별은 엔티티가, 사용자 문구는 화면이 정한다.
        setErrorMessage(
          isDuplicateFolderNameError(error)
            ? "이미 있는 폴더 이름이에요"
            : "폴더를 만들지 못했어요. 잠시 후 다시 시도해주세요",
        );
      },
    });
  };

  return (
    // 날짜·시간 선택, 로그인 화면과 같은 배치 — 패널 높이를 채우고 내용은 세로 가운데에 둔다.
    <div className="flex h-full flex-col justify-center px-4 py-6">
      <div className="mx-auto w-full max-w-100">
        <h1 className="text-center text-heading-3 text-text-strong">
          새 폴더 만들기
        </h1>

        <label className="mt-6 block">
          <span className="text-heading-3 text-text-strong">이름</span>
          <input
            value={folderName}
            onChange={(event) => setFolderName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                submit();
              }
            }}
            placeholder="새 폴더"
            maxLength={FOLDER_NAME_MAX_LENGTH}
            // 화면에 들어오자마자 이름부터 치도록.
            // biome-ignore lint/a11y/noAutofocus: 이 화면의 유일한 입력이고 진입 목적이 이름 입력이다
            autoFocus
            className="mt-3 h-12 w-full rounded-2xl bg-background-list px-4 text-body-1 text-text-normal outline-none placeholder:text-text-assistive"
          />
        </label>

        <fieldset className="mt-6">
          <legend className="text-heading-3 text-text-strong">색상</legend>
          <div className="mt-3 space-y-3">
            {COLOR_ROWS.map((row) => (
              <div key={row[0]} className="flex justify-between">
                {row.map((option) => (
                  <Swatch
                    key={option}
                    color={option}
                    selected={option === color}
                    onSelect={() => setColor(option)}
                  />
                ))}
              </div>
            ))}
          </div>
        </fieldset>

        {errorMessage ? (
          <p role="alert" className="mt-3 text-action-destructive text-body-3">
            {errorMessage}
          </p>
        ) : null}

        <div className="mt-6 flex gap-2">
          <ActionButton variant="secondary" onClick={onCancel}>
            취소
          </ActionButton>
          <ActionButton
            onClick={submit}
            disabled={!parsed.success || createFolder.isPending}
          >
            저장
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

interface SwatchProps {
  color: SelectableFolderColor;
  selected: boolean;
  onSelect: () => void;
}

function Swatch({ color, selected, onSelect }: SwatchProps) {
  const hex = FOLDER_TONE_HEX[color];

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={color}
      aria-pressed={selected}
      className={clsx(
        "flex size-10 items-center justify-center rounded-full border-2",
        !selected && "border-transparent",
      )}
      // 링 색은 색상마다 다른 동적 값(solid 의 50% 알파)이라 유틸리티 클래스로 만들 수 없다.
      style={{ borderColor: selected ? `${hex}80` : undefined }}
    >
      <span className="size-8 rounded-full" style={{ backgroundColor: hex }} />
    </button>
  );
}
