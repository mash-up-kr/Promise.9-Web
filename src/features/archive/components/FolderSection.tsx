import { Plus } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, View } from "react-native";

import { Icon } from "@/components/ui/icon/Icon";
import { Text } from "@/components/ui/text/Text";
import { tv } from "@/lib/tv";

export interface FolderSectionAction {
  label: string;
  onPress: () => void;
}

// 가로 여백은 보관함 화면 기준(px-5)이지만, 이미 여백을 가진 컨테이너(폴더 이동 시트) 안에서는
// 호출부가 className 으로 덮어쓴다.
const sectionStyles = tv({ base: "gap-3 px-5" });

export interface FolderSectionProps {
  title: string;
  action?: FolderSectionAction;
  className?: string;
  children: ReactNode;
}

export function FolderSection({
  title,
  action,
  className,
  children,
}: FolderSectionProps) {
  return (
    <View className={sectionStyles({ class: className })}>
      <View className="flex-row items-center justify-between">
        <Text variant="heading-2" className="text-text-normal">
          {title}
        </Text>
        {action ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={action.label}
            onPress={action.onPress}
          >
            <Icon iconNode={Plus} size={24} className="text-icon-accent" />
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}
