import Svg, { G, Path } from "react-native-svg";

// lucide 로 대체하지 않음 — 시안 폴더(Icon/folder)는 왼쪽 탭이 짧고 모서리가 크게 둥근
// 채움형이라 lucide Folder(각진 아웃라인)와 형태가 달라 Figma 에셋 경로를 그대로 옮겼다
// (DiceIcon 선례). RN svg 는 currentColor 를 못 읽어 색은 hex 로 직접 주입한다.
export interface FolderIconProps {
  /** 아이콘 프레임 한 변. 시안 글리프(16x14)는 프레임 안에 여백을 두고 놓인다. */
  size?: number;
  color?: string;
}

export function FolderIcon({ size = 14, color = "#8A8A93" }: FolderIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <G transform="translate(2, 3)">
        <Path
          d="M16 6.22222V10.1111C16 13.2222 15.2 14 12 14H4C0.8 14 0 13.2222 0 10.1111V3.11111C0 0 0.8 0 4 0H5.2C6.4 0 6.664 0.342222 7.12 0.933333L8 1.94444C8.304 2.33333 8.8 2.33333 9.6 2.33333H12C15.2 2.33333 16 3.11111 16 6.22222Z"
          fill={color}
        />
      </G>
    </Svg>
  );
}
