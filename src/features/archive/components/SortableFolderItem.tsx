import { Menu } from "lucide-react-native";
import { useMemo } from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  measure,
  runOnJS,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

import { FolderIcon } from "@/components/ui/icon/FolderIcon";
import { Icon } from "@/components/ui/icon/Icon";
import { Text } from "@/components/ui/text/Text";

import type { ArchiveFolder } from "../archive.types";
import {
  ITEM_HEIGHT,
  SORTABLE_SPRING,
  useSortableContext,
} from "./sortable.context";

// 아이콘 색(raw hex) — FolderItem 과 동일 토큰(folder-gray / folder-blue-solid).
const GRAY_FILL = "#65656b";
const BLUE_FILL = "#61a8ef";

export interface SortableFolderItemProps {
  folder: ArchiveFolder;
}

// 정렬 편집 모드의 폴더 행. 절대배치(top = order*ITEM_HEIGHT)라 재정렬은 translateY 로만
// 표현되고, 모서리는 리스트 컨테이너가 clip 한다. 핸들(≡)을 길게 눌러 드래그를 시작한다.
export function SortableFolderItem({ folder }: SortableFolderItemProps) {
  const ctx = useSortableContext();

  const rowStyle = useAnimatedStyle(() => {
    const index = ctx.order.value.indexOf(folder.id);
    const active = ctx.activeId.value === folder.id;
    return {
      transform: [
        {
          translateY: active
            ? ctx.activeTop.value
            : withSpring(index * ITEM_HEIGHT, SORTABLE_SPRING),
        },
        { scale: withSpring(active ? 1.02 : 1, SORTABLE_SPRING) },
      ],
      zIndex: active ? 10 : 0,
      shadowColor: "#000",
      shadowOpacity: active ? 0.3 : 0,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: active ? 6 : 0,
    };
  });

  // 시각상 마지막 행 뒤에는 divider 를 감춘다(재정렬에 따라 실시간).
  const dividerStyle = useAnimatedStyle(() => {
    const index = ctx.order.value.indexOf(folder.id);
    return { opacity: index === ctx.order.value.length - 1 ? 0 : 1 };
  });

  // 드래그 시작 시 부모의 isDragging state 변경으로 re-render 가 일어나므로, 제스처가
  // 매 렌더마다 새로 만들어져 진행 중 드래그가 끊기지 않도록 memoize 한다.
  const drag = useMemo(
    () =>
      Gesture.Pan()
        .activateAfterLongPress(120)
        .onStart((event) => {
          const container = measure(ctx.containerRef);
          const scrollView = measure(ctx.scrollRef);
          if (!container || !scrollView) {
            return;
          }
          ctx.viewportTop.value = scrollView.pageY;
          ctx.viewportHeight.value = scrollView.height;
          ctx.listContentTop.value =
            container.pageY - scrollView.pageY + ctx.scrollOffset.value;
          ctx.fingerY.value = event.absoluteY;
          ctx.activeTop.value =
            ctx.order.value.indexOf(folder.id) * ITEM_HEIGHT;
          ctx.activeId.value = folder.id;
          ctx.isDragging.value = true;
          runOnJS(ctx.onDraggingChange)(true);
        })
        .onUpdate((event) => {
          if (ctx.activeId.value !== folder.id) {
            return;
          }
          ctx.fingerY.value = event.absoluteY;
          ctx.updateActive();
        })
        .onEnd(() => {
          if (ctx.activeId.value !== folder.id) {
            return;
          }
          const finalOrder = ctx.order.value.slice();
          ctx.isDragging.value = false;
          ctx.activeId.value = null;
          runOnJS(ctx.onDraggingChange)(false);
          runOnJS(ctx.commit)(finalOrder);
        })
        .onFinalize(() => {
          if (ctx.activeId.value === folder.id) {
            ctx.isDragging.value = false;
            ctx.activeId.value = null;
            runOnJS(ctx.onDraggingChange)(false);
          }
        }),
    [ctx, folder.id],
  );

  return (
    <Animated.View style={rowStyle} className="absolute right-0 left-0">
      <View className="h-[52px] flex-row items-center justify-between overflow-hidden bg-background-thumbnail px-4">
        <View className="flex-row items-center gap-3">
          <FolderIcon
            color={folder.tone === "blue" ? BLUE_FILL : GRAY_FILL}
            size={28}
          />
          <Text variant="body-2-normal" className="text-text-normal">
            {folder.name}
          </Text>
        </View>
        <GestureDetector gesture={drag}>
          <View
            accessible
            accessibilityRole="button"
            accessibilityLabel={`${folder.name} 순서 변경`}
            hitSlop={8}
            className="py-2 pl-4"
          >
            <Icon iconNode={Menu} size={20} className="text-icon-assistive" />
          </View>
        </GestureDetector>
      </View>
      <Animated.View
        style={dividerStyle}
        className="absolute right-0 bottom-0 left-0"
      >
        <View testID="folder-divider" className="mx-4 h-px bg-border-divider" />
      </Animated.View>
    </Animated.View>
  );
}
