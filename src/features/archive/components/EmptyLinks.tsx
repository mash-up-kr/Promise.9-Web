import { View } from "react-native";

import { EmptyState } from "@/components/ui/empty-state/EmptyState";
import { useHeaderHeight } from "@/components/ui/header/Header";
import { Illustration } from "@/components/ui/illustration/Illustration";

import { resolveEmptyLinksMessage } from "../archive.utils";

export interface EmptyLinksProps {
  /** 보관함 라우트 id — 기본 폴더마다 안내 문구가 다르다. */
  folderId: string;
}

/** 폴더에 링크가 하나도 없을 때의 빈 상태. 문구만 이 화면 소관이고 형태는 공용 EmptyState 를 쓴다. */
export function EmptyLinks({ folderId }: EmptyLinksProps) {
  const { title, description } = resolveEmptyLinksMessage(folderId);
  // 헤더가 오버레이라 그 높이만큼 내려 가운데를 맞춘다.
  const headerHeight = useHeaderHeight();

  return (
    <View
      className="flex-1 justify-center bg-background-base"
      style={{ paddingTop: headerHeight }}
    >
      <EmptyState
        illustration={
          <Illustration
            name="empty-link"
            accessibilityLabel="저장된 링크 없음"
          />
        }
        title={title}
        description={description}
      />
    </View>
  );
}
