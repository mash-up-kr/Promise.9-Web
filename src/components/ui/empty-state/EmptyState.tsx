import type { ReactNode } from "react";
import { View } from "react-native";

import { Text } from "@/components/ui/text/Text";
import { VStack } from "@/components/ui/vstack/VStack";
import { tv } from "@/lib/tv";

export type EmptyStateSize = "page" | "section";

// 화면 전체를 채우는 빈 상태와 섹션 안에 들어가는 빈 상태는 설명→액션 간격만 다르다(시안).
export const emptyStateActionStyles = tv({
  variants: {
    size: {
      page: "mt-5",
      section: "mt-4",
    },
  },
  defaultVariants: { size: "page" },
});

export interface EmptyStateProps {
  /** 기본 page */
  size?: EmptyStateSize;
  /**
   * 그래픽 슬롯. 시안이 상태마다 그림을 갈아끼우는 구조라 컴포넌트가 그림을 소유하지 않는다.
   * (디자이너 주석: "그래픽에 변경사항이 생길 경우 교체 요청을 드릴 수 있습니다")
   */
  illustration: ReactNode;
  title: string;
  description?: string;
  /** 재시도·생성 같은 후속 동작. 라우팅·mutation 배선은 호출부가 갖는다. */
  action?: ReactNode;
}

/** 비어 있거나 실패한 영역을 그래픽 + 안내 문구로 채운다. */
export function EmptyState({
  size = "page",
  illustration,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <VStack className="items-center px-5">
      {illustration}
      <VStack className="mt-4 items-center gap-1">
        <Text variant="heading-2" className="text-center text-text-strong">
          {title}
        </Text>
        {description ? (
          <Text variant="body-1" className="text-center text-text-neutral">
            {description}
          </Text>
        ) : null}
      </VStack>
      {action ? (
        <View
          testID="empty-state-action"
          className={emptyStateActionStyles({ size })}
        >
          {action}
        </View>
      ) : null}
    </VStack>
  );
}
