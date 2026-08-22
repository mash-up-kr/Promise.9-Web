import type { PropsWithChildren } from "react";
import { View } from "react-native";

import { useHeaderHeight } from "@/components/ui/header/Header";
import { HStack } from "@/components/ui/hstack/HStack";
import { Skeleton } from "@/components/ui/skeleton/Skeleton";
import { VStack } from "@/components/ui/vstack/VStack";

// 시안 스켈레톤 블록 색 — 배경 위에 흰색 5% (합성값 ≈ #262626).
const BLOCK = "bg-opacity-white-05";

const CARD_COUNT = 2;
const LIST_ROW_COUNT = 3;
const CHIP_WIDTHS = [
  ["w-16", "w-24", "w-20", "w-28"],
  ["w-20", "w-16", "w-28", "w-20"],
];

/**
 * 홈 로딩 스켈레톤.
 *
 * 시안 정책상 콘텐츠가 가장 많은 상태(리마인드 + 키워드까지 4섹션)를 기준으로 그리고,
 * 로드가 끝나면 섹션별이 아니라 전체가 한 번에 실제 콘텐츠로 바뀐다.
 */
export function HomeSkeleton() {
  const headerHeight = useHeaderHeight();

  return (
    <View style={{ paddingTop: headerHeight }}>
      <VStack className="gap-12 pt-5 pb-8">
        <SkeletonSection>
          <HStack className="gap-3 px-5">
            {Array.from({ length: CARD_COUNT }).map((_, index) => (
              <CardBlock key={index} />
            ))}
          </HStack>
        </SkeletonSection>

        <SkeletonSection>
          <VStack className="gap-2 px-5">
            {CHIP_WIDTHS.map((row, rowIndex) => (
              <HStack key={rowIndex} className="gap-1.5">
                {row.map((width, index) => (
                  <Skeleton
                    key={index}
                    variant="circular"
                    className={`h-[42px] ${width} ${BLOCK}`}
                  />
                ))}
              </HStack>
            ))}
          </VStack>
        </SkeletonSection>

        <SkeletonSection>
          <VStack className="gap-2 px-5">
            {Array.from({ length: LIST_ROW_COUNT }).map((_, index) => (
              <ListRowBlock key={index} />
            ))}
          </VStack>
        </SkeletonSection>

        <SkeletonSection>
          <VStack className="gap-10">
            <VStack className="gap-4">
              <Skeleton className={`ml-5 h-6 w-24 ${BLOCK}`} />
              <HStack className="gap-3 px-5">
                {Array.from({ length: CARD_COUNT }).map((_, index) => (
                  <CardBlock key={index} />
                ))}
              </HStack>
            </VStack>
          </VStack>
        </SkeletonSection>
      </VStack>
    </View>
  );
}

/** 섹션 타이틀 자리 + 본문 */
function SkeletonSection({ children }: PropsWithChildren) {
  return (
    <VStack testID="home-skeleton-section" className="gap-4">
      <Skeleton className={`ml-5 h-7 w-28 ${BLOCK}`} />
      {children}
    </VStack>
  );
}

/** Content Card 자리 — 썸네일 160×200 + 제목 2줄 */
function CardBlock() {
  return (
    <VStack className="w-40 gap-2">
      <Skeleton className={`h-[200px] w-40 rounded-[20px] ${BLOCK}`} />
      <VStack className="gap-1">
        <Skeleton className={`h-4 w-40 ${BLOCK}`} />
        <Skeleton className={`h-4 w-24 ${BLOCK}`} />
      </VStack>
    </VStack>
  );
}

/** List Card 자리 — 썸네일 96 + 제목 2줄 */
function ListRowBlock() {
  return (
    <HStack className="items-center gap-3">
      <Skeleton className={`size-24 rounded-2xl ${BLOCK}`} />
      <VStack className="gap-2">
        <Skeleton className={`h-4 w-48 ${BLOCK}`} />
        <Skeleton className={`h-4 w-32 ${BLOCK}`} />
      </VStack>
    </HStack>
  );
}
