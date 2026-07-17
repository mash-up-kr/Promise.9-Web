import { Link } from "lucide-react-native";
import { View } from "react-native";

import { Icon } from "@/components/ui/icon/Icon";
import { tv } from "@/lib/tv";

const fallbackStyles = tv({
  base: "items-center justify-center bg-background-thumbnail",
});

export interface ThumbnailFallbackProps {
  // 부모 썸네일 슬롯의 크기·모서리를 그대로 물려받는다(size·rounded 등).
  className?: string;
  iconSize?: number;
  testID?: string;
}

/** 썸네일이 없거나 로드에 실패했을 때 중앙에 Link 아이콘을 보여주는 폴백. */
export function ThumbnailFallback({
  className,
  iconSize = 28,
  testID,
}: ThumbnailFallbackProps) {
  return (
    <View testID={testID} className={fallbackStyles({ class: className })}>
      <Icon iconNode={Link} size={iconSize} className="text-text-assistive" />
    </View>
  );
}
