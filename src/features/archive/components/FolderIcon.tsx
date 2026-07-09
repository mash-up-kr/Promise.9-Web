import { Folder } from "lucide-react-native";

import type { FolderTone } from "../types";

// lucide Folder 를 "채움(fill)" 스타일로 쓰기 위한 전용 래퍼.
// 공통 Icon 래퍼는 className(디자인 토큰) 색을 stroke 로만 주입해 fill 이 안 먹으므로,
// 여기서는 토큰 색을 raw 값으로 stroke·fill 에 직접 넣는다.
// 색 출처: global.css --color-folder-gray / --color-folder-blue-solid (Figma 동기화 토큰).
const TONE_FILL: Record<FolderTone, string> = {
  gray: "#65656b",
  blue: "#61a8ef",
};

export interface FolderIconProps {
  tone?: FolderTone;
  size?: number;
}

export function FolderIcon({ tone = "gray", size = 28 }: FolderIconProps) {
  const color = TONE_FILL[tone];
  return <Folder size={size} color={color} fill={color} />;
}
