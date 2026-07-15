import { Children, type ReactElement, type ReactNode } from "react";
import { View } from "react-native";

// 아이템 사이 구분선. 카드 배경(thumbnail) 위에 16px 인셋된 divider 라인을 얹는다.
function Divider() {
  return (
    <View testID="folder-divider" className="h-px bg-background-thumbnail">
      <View className="mx-4 h-px bg-border-divider" />
    </View>
  );
}

export interface FolderGroupProps {
  children: ReactNode;
}

// rounded 컨테이너 + 자식 사이 divider. 마지막 아이템 뒤에는 넣지 않는다.
export function FolderGroup({ children }: FolderGroupProps) {
  const items = Children.toArray(children) as ReactElement[];
  return (
    <View className="overflow-hidden rounded-[20px]">
      {items.map((item, index) => (
        <View key={item.key}>
          {item}
          {index < items.length - 1 ? <Divider /> : null}
        </View>
      ))}
    </View>
  );
}
