import { View } from "react-native";

import { Skeleton } from "@/components/ui/skeleton/Skeleton";

// 실제 폴더 수를 모르는 상태라 적당한 개수만 자리를 잡아둔다.
const PLACEHOLDER_COUNT = 3;

// 내 폴더 목록 로딩 자리표시자 — FolderGroup + FolderItem 과 같은 높이·여백을 쓴다.
export function FolderListSkeleton() {
  return (
    <View
      testID="folder-list-skeleton"
      className="overflow-hidden rounded-[20px] bg-background-thumbnail"
    >
      {Array.from({ length: PLACEHOLDER_COUNT }).map((_, index) => (
        <View
          // 정적 목록이라 index 키가 안전하다.
          key={index}
          className="h-[52px] flex-row items-center gap-3 px-4 py-3"
        >
          <Skeleton variant="rounded" className="h-7 w-7" />
          <Skeleton className="h-4 w-28" />
        </View>
      ))}
    </View>
  );
}
