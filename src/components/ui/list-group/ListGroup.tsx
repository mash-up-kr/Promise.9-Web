import { Children, type ReactElement, type ReactNode } from "react";
import { View } from "react-native";

// 아이템 사이 구분선. 카드 배경(list) 위에 16px 인셋된 divider 라인을 얹는다.
function Divider() {
  return (
    <View testID="list-divider" className="h-px bg-background-list">
      <View className="mx-4 h-px bg-border-divider" />
    </View>
  );
}

export interface ListGroupProps {
  children: ReactNode;
}

// rounded 카드 컨테이너 + 자식 사이 divider. 마지막 아이템 뒤에는 넣지 않는다.
// Figma "Folder Group" — 보관함·설정 리스트 공용.
export function ListGroup({ children }: ListGroupProps) {
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
