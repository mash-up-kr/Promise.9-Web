import { Ellipsis, Search } from "lucide-react-native";
import { Pressable } from "react-native";

import { Icon } from "@/components/ui/icon/Icon";

export function HeaderActions() {
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="검색"
        className="items-center justify-center rounded-full p-2"
      >
        <Icon iconNode={Search} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="더보기"
        className="items-center justify-center rounded-full p-2"
      >
        <Icon iconNode={Ellipsis} />
      </Pressable>
    </>
  );
}
