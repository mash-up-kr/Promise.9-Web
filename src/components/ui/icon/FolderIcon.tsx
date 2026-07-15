import { Folder } from "lucide-react-native";

export interface FolderIconProps {
  size?: number;
  color?: string;
}

// lucide Folder 를 "채움(fill)" 스타일로 쓰기 위한 전용 래퍼.
// 공통 Icon 래퍼는 className(디자인 토큰) 색을 stroke 로만 주입해 fill 이 안 먹으므로,
// 여기서는 색을 raw hex 로 stroke·fill 에 직접 넣는다.
export function FolderIcon({ size = 14, color = "#8A8A93" }: FolderIconProps) {
  return <Folder size={size} color={color} fill={color} />;
}
