import { useCallback, useEffect, useMemo } from "react";
import Animated, {
  type AnimatedRef,
  type SharedValue,
  scrollTo,
  useAnimatedRef,
  useFrameCallback,
  useSharedValue,
} from "react-native-reanimated";

import type { ArchiveFolder } from "../archive.types";
import { SortableFolderItem } from "./SortableFolderItem";
import {
  clampWorklet,
  ITEM_HEIGHT,
  SortableContext,
  type SortableContextValue,
} from "./sortable.context";

// 가장자리 자동 스크롤: 손가락이 뷰포트 위/아래 EDGE 안에 들어오면 프레임마다 SPEED 만큼 스크롤.
const EDGE = 72;
const SCROLL_SPEED = 8;

export interface SortableFolderListProps {
  folders: ArchiveFolder[];
  onReorder: (folders: ArchiveFolder[]) => void;
  scrollRef: AnimatedRef<Animated.ScrollView>;
  scrollOffset: SharedValue<number>;
  scrollContentHeight: SharedValue<number>;
  onDraggingChange: (dragging: boolean) => void;
}

// 내 폴더 정렬 편집 리스트(직접 구현). FlatList 를 쓰지 않아(=VirtualizedList 아님) 일반
// ScrollView 안에 넣어도 경고가 없다. 행은 절대배치 + reanimated 로 드래그·reflow 하고,
// 드래그가 뷰포트 끝에 닿으면 바깥 ScrollView 를 자동 스크롤한다.
export function SortableFolderList({
  folders,
  onReorder,
  scrollRef,
  scrollOffset,
  scrollContentHeight,
  onDraggingChange,
}: SortableFolderListProps) {
  const order = useSharedValue<string[]>(folders.map((folder) => folder.id));
  const activeId = useSharedValue<string | null>(null);
  const activeTop = useSharedValue(0);
  const fingerY = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const viewportTop = useSharedValue(0);
  const viewportHeight = useSharedValue(0);
  const listContentTop = useSharedValue(0);
  const containerRef = useAnimatedRef<Animated.View>();

  // 폴더 목록이 바뀌면(커밋·추가) 순서를 동기화한다. 드래그 중엔 re-render 가 없어 안전.
  useEffect(() => {
    order.value = folders.map((folder) => folder.id);
  }, [folders, order]);

  const foldersById = useMemo(
    () => new Map(folders.map((folder) => [folder.id, folder])),
    [folders],
  );

  const commit = useCallback(
    (nextOrder: string[]) => {
      const next = nextOrder
        .map((id) => foldersById.get(id))
        .filter((folder): folder is ArchiveFolder => folder !== undefined);
      onReorder(next);
    },
    [foldersById, onReorder],
  );

  // 손가락 위치(+현재 스크롤)로 활성 행 top 과 순서를 갱신한다. onUpdate·자동스크롤 프레임에서 공용.
  const updateActive = useCallback(() => {
    "worklet";
    const id = activeId.value;
    if (id === null) {
      return;
    }
    const contentY = scrollOffset.value + (fingerY.value - viewportTop.value);
    const maxTop = (order.value.length - 1) * ITEM_HEIGHT;
    activeTop.value = clampWorklet(
      contentY - listContentTop.value - ITEM_HEIGHT / 2,
      0,
      maxTop,
    );
    const newIndex = Math.round(activeTop.value / ITEM_HEIGHT);
    const curIndex = order.value.indexOf(id);
    if (curIndex !== -1 && newIndex !== curIndex) {
      const next = order.value.slice();
      next.splice(curIndex, 1);
      next.splice(newIndex, 0, id);
      order.value = next;
    }
  }, [
    activeId,
    activeTop,
    fingerY,
    listContentTop,
    order,
    scrollOffset,
    viewportTop,
  ]);

  useFrameCallback(() => {
    "worklet";
    if (!isDragging.value) {
      return;
    }
    const y = fingerY.value;
    const top = viewportTop.value;
    const height = viewportHeight.value;
    let direction = 0;
    if (y < top + EDGE) {
      direction = -1;
    } else if (y > top + height - EDGE) {
      direction = 1;
    }
    if (direction !== 0) {
      const maxScroll = Math.max(0, scrollContentHeight.value - height);
      const nextOffset = clampWorklet(
        scrollOffset.value + direction * SCROLL_SPEED,
        0,
        maxScroll,
      );
      scrollTo(scrollRef, 0, nextOffset, false);
    }
    updateActive();
  });

  const contextValue = useMemo<SortableContextValue>(
    () => ({
      order,
      activeId,
      activeTop,
      fingerY,
      isDragging,
      viewportTop,
      viewportHeight,
      listContentTop,
      scrollOffset,
      scrollRef,
      containerRef,
      updateActive,
      onDraggingChange,
      commit,
    }),
    [
      order,
      activeId,
      activeTop,
      fingerY,
      isDragging,
      viewportTop,
      viewportHeight,
      listContentTop,
      scrollOffset,
      scrollRef,
      containerRef,
      updateActive,
      onDraggingChange,
      commit,
    ],
  );

  return (
    <Animated.View
      ref={containerRef}
      className="overflow-hidden rounded-[20px] bg-background-thumbnail"
      style={{ height: folders.length * ITEM_HEIGHT }}
    >
      <SortableContext.Provider value={contextValue}>
        {folders.map((folder) => (
          <SortableFolderItem key={folder.id} folder={folder} />
        ))}
      </SortableContext.Provider>
    </Animated.View>
  );
}
