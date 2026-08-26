import { useEffect, useRef } from "react";
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  View,
} from "react-native";

import { Text } from "@/components/ui/text/Text";
import { isWeb } from "@/constants/platform.constants";

export const WHEEL_ITEM_HEIGHT = 44;
const VISIBLE_ROWS = 3;
const WEB_SNAP_DEBOUNCE_MS = 150;

export interface WheelPickerItem<T extends string | number> {
  value: T;
  label: string;
}

export interface WheelPickerProps<T extends string | number> {
  items: WheelPickerItem<T>[];
  selectedValue: T;
  onChange: (value: T) => void;
  testID?: string;
}

export function offsetToIndex(offsetY: number, itemCount: number): number {
  const index = Math.round(offsetY / WHEEL_ITEM_HEIGHT);
  return Math.min(Math.max(index, 0), itemCount - 1);
}

export function WheelPicker<T extends string | number>({
  items,
  selectedValue,
  onChange,
  testID,
}: WheelPickerProps<T>) {
  const scrollRef = useRef<ScrollView>(null);
  const webSnapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedIndex = Math.max(
    items.findIndex((item) => item.value === selectedValue),
    0,
  );

  // 외부에서 selectedValue 가 바뀌면(초기 진입 포함) 해당 위치로 정렬한다.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      y: selectedIndex * WHEEL_ITEM_HEIGHT,
      animated: false,
    });
  }, [selectedIndex]);

  // cleanup: web 스냅 디바운스 타이머 정리
  useEffect(() => {
    return () => {
      if (webSnapTimer.current) clearTimeout(webSnapTimer.current);
    };
  }, []);

  const commit = (offsetY: number) => {
    const item = items[offsetToIndex(offsetY, items.length)];
    if (item.value !== selectedValue) onChange(item.value);
  };

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    commit(e.nativeEvent.contentOffset.y);
  };

  // RN Web 은 snapToInterval·momentum 이벤트가 없어 스크롤 멈춤을 디바운스로 감지해 스냅한다.
  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!isWeb) return;
    const y = e.nativeEvent.contentOffset.y;
    if (webSnapTimer.current) clearTimeout(webSnapTimer.current);
    webSnapTimer.current = setTimeout(() => {
      const index = offsetToIndex(y, items.length);
      scrollRef.current?.scrollTo({
        y: index * WHEEL_ITEM_HEIGHT,
        animated: true,
      });
      commit(y);
    }, WEB_SNAP_DEBOUNCE_MS);
  };

  return (
    <View
      style={{ height: WHEEL_ITEM_HEIGHT * VISIBLE_ROWS }}
      className="w-full"
    >
      <View
        pointerEvents="none"
        style={{ top: WHEEL_ITEM_HEIGHT, height: WHEEL_ITEM_HEIGHT }}
        className="absolute right-0 left-0 rounded-xl bg-opacity-white-10"
      />
      <ScrollView
        ref={scrollRef}
        testID={testID}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_ITEM_HEIGHT}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleMomentumEnd}
        contentContainerStyle={{ paddingVertical: WHEEL_ITEM_HEIGHT }}
      >
        {items.map((item) => {
          const isSelected = item.value === selectedValue;
          return (
            <Pressable
              key={String(item.value)}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              onPress={() => onChange(item.value)}
              style={{ height: WHEEL_ITEM_HEIGHT }}
              className="items-center justify-center"
            >
              <Text
                variant="heading-3"
                className={
                  isSelected ? "text-text-strong" : "text-text-assistive"
                }
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
