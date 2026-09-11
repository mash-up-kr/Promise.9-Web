import { ChevronRight } from "lucide-react-native";
import { View } from "react-native";

import { Icon } from "@/components/ui/icon/Icon";
import { ListGroup } from "@/components/ui/list-group/ListGroup";
import { Skeleton } from "@/components/ui/skeleton/Skeleton";

// 실제 폴더 수를 모르는 상태라 적당한 개수만 자리를 잡아둔다. 폴더명 길이는 줄마다 조금씩 다르게.
const NAME_WIDTHS = ["w-24", "w-16", "w-28"];

/**
 * 내 폴더 목록 로딩 자리표시자.
 * 로드 중인 기본 폴더 행(아이콘 · 이름 · 개수 스켈레톤 · chevron)과 같은 구조로 그려 전환이 튀지 않게 한다.
 */
export function FolderListSkeleton() {
  return (
    <View testID="folder-list-skeleton">
      <ListGroup>
        {NAME_WIDTHS.map((width) => (
          // FolderItem 과 같은 높이·여백.
          <View
            key={width}
            className="h-[52px] flex-row items-center justify-between bg-background-list px-4 py-3"
          >
            <View className="flex-row items-center gap-3">
              <Skeleton
                testID="folder-list-skeleton-block"
                surface="list"
                className="size-7 rounded-lg"
              />
              <Skeleton
                testID="folder-list-skeleton-block"
                surface="list"
                className={`h-4 ${width}`}
              />
            </View>
            <View className="flex-row items-center gap-1">
              <Skeleton
                testID="folder-list-skeleton-block"
                surface="list"
                className="h-4 w-6"
              />
              <Icon
                iconNode={ChevronRight}
                size={16}
                className="text-icon-assistive"
              />
            </View>
          </View>
        ))}
      </ListGroup>
    </View>
  );
}
