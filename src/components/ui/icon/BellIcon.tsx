import { Bell } from "lucide-react-native";

// 시안(Reminder Icon)은 채움형 벨 — 공통 Icon 래퍼는 className 색을 stroke 로만 주입해
// fill 이 안 먹으므로, FolderIcon 과 같은 방식으로 raw hex 를 stroke·fill 에 직접 넣는다.
// 색은 리마인드 on(#E9E9EB)/off(#8A8A93) 상태를 호출부가 정한다.
export interface BellIconProps {
  size?: number;
  color?: string;
}

export function BellIcon({ size = 20, color = "#E9E9EB" }: BellIconProps) {
  return <Bell size={size} color={color} fill={color} />;
}
