export interface FolderGlyphProps {
  /** 서버가 내려준 폴더 색 hex. 미분류 등 색이 없으면 회색 토큰으로 그린다. */
  color?: string;
}

/** 폴더 칩 앞의 폴더 모양 아이콘. */
export function FolderGlyph({ color }: FolderGlyphProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <path
        d="M1.5 4.25A1.75 1.75 0 0 1 3.25 2.5h2.4c.53 0 1.03.24 1.36.65l.62.77h5.12c.97 0 1.75.78 1.75 1.75v6.08c0 .97-.78 1.75-1.75 1.75H3.25A1.75 1.75 0 0 1 1.5 11.75V4.25Z"
        fill={color ?? "var(--color-folder-gray)"}
      />
    </svg>
  );
}
