import { createContext, useContext } from "react";
import type Animated from "react-native-reanimated";
import type { AnimatedRef, SharedValue } from "react-native-reanimated";

// 정렬 행 높이(고정). 균일 높이라 재정렬 인덱스 계산이 index*ITEM_HEIGHT 로 단순해진다.
export const ITEM_HEIGHT = 52;

// 드래그 스프링. 활성 행 이동/나머지 행 reflow 에 공통으로 쓴다.
// dampingRatio 1 = overshoot 없음 → 튕김("꿀렁") 없이 담백하게 정착한다.
export const SORTABLE_SPRING = { duration: 220, dampingRatio: 1 } as const;

// 값을 [min, max] 로 자르는 worklet.
export function clampWorklet(value: number, min: number, max: number): number {
  "worklet";
  return Math.min(Math.max(value, min), max);
}

// SortableFolderList(상태 소유) ↔ SortableFolderItem(제스처/스타일) 를 잇는 컨텍스트.
// 별도 파일로 둬 list ↔ item 순환 import 를 피한다.
export interface SortableContextValue {
  /** 현재(드래그 중 실시간 반영) 폴더 id 순서. */
  order: SharedValue<string[]>;
  /** 드래그 중인 행 id. 없으면 null. */
  activeId: SharedValue<string | null>;
  /** 활성 행의 리스트 내 top(px). */
  activeTop: SharedValue<number>;
  /** 손가락의 화면 절대 Y(px). 자동 스크롤 판정에 쓴다. */
  fingerY: SharedValue<number>;
  isDragging: SharedValue<boolean>;
  /** 스크롤 뷰포트의 화면 top / height (드래그 시작 시 measure). */
  viewportTop: SharedValue<number>;
  viewportHeight: SharedValue<number>;
  /** 리스트 컨테이너의 스크롤 콘텐츠 내 top offset. */
  listContentTop: SharedValue<number>;
  /** 바깥 ScrollView 의 현재 스크롤 offset. */
  scrollOffset: SharedValue<number>;
  scrollRef: AnimatedRef<Animated.ScrollView>;
  containerRef: AnimatedRef<Animated.View>;
  /** 손가락 위치로 활성 행 top·순서를 갱신하는 worklet. */
  updateActive: () => void;
  /** 드래그 시작/종료를 JS(부모 scrollEnabled 토글)로 알린다. */
  onDraggingChange: (dragging: boolean) => void;
  /** 드래그 종료 시 최종 순서를 커밋한다. */
  commit: (order: string[]) => void;
}

export const SortableContext = createContext<SortableContextValue | null>(null);

export function useSortableContext(): SortableContextValue {
  const ctx = useContext(SortableContext);
  if (!ctx) {
    throw new Error(
      "SortableFolderItem 은 SortableFolderList 안에서만 쓸 수 있습니다.",
    );
  }
  return ctx;
}
