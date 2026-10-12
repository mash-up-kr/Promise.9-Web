import { Icon } from "@promise9/ui/icon/Icon";
import { Text } from "@promise9/ui/text/Text";
import { Plus } from "lucide-react-native";
import { Pressable } from "react-native";

export interface NewFolderButtonProps {
  onPress: () => void;
}

// 내 폴더가 비어 있을 때 폴더 목록 자리에 표시하는 전체 폭 버튼.
export function NewFolderButton({ onPress }: NewFolderButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="h-[52px] flex-row items-center gap-3 rounded-[20px] bg-background-list px-4"
    >
      <Icon iconNode={Plus} size={24} className="text-icon-accent" />
      <Text variant="body-2-normal" className="text-text-normal">
        새 폴더 추가
      </Text>
    </Pressable>
  );
}
