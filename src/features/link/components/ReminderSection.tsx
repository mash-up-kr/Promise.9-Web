import { DiceIcon } from "@promise9/ui/icon/DiceIcon";
import {
  ReminderOffRow,
  ReminderOnCard,
} from "@promise9/ui/reminder-card/ReminderCard";
import { Text } from "@promise9/ui/text/Text";
import { Toggle } from "@promise9/ui/toggle/Toggle";
import { useState } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { isWeb } from "@/constants/platform.constants";
import {
  formatRemainingPeriod,
  formatReminderDate,
  formatReminderTime,
  getRandomReminderDays,
  type ReminderValue,
} from "@/features/link/reminder.utils";
import {
  addDaysDate,
  getTomorrowDate,
  roundUpToQuarter,
} from "@/utils/datetime";

import { DatePickerModal } from "./DatePickerModal";
import { TimePickerModal } from "./TimePickerModal";

const PRESETS = [
  { days: 1, label: "내일" },
  { days: 3, label: "3일 후" },
  { days: 7, label: "7일 후" },
  { days: 14, label: "14일 후" },
];

export interface ReminderSectionProps {
  value: ReminderValue | null;
  onChange: (value: ReminderValue | null) => void;
}

export function ReminderSection({ value, onChange }: ReminderSectionProps) {
  // 프리셋 선택은 서버로 가지 않는 표시 상태 — 직접 선택·랜덤 시 해제(자동 매칭 없음, 시안 정책).
  const [selectedPresetDays, setSelectedPresetDays] = useState<number | null>(
    null,
  );
  const [openPicker, setOpenPicker] = useState<"date" | "time" | null>(null);

  const handleToggle = (isEnabled: boolean) => {
    if (!isEnabled) {
      setSelectedPresetDays(null);
      onChange(null);
      return;
    }
    setSelectedPresetDays(1);
    onChange({ date: getTomorrowDate(), ...roundUpToQuarter() });
  };

  const handlePreset = (days: number) => {
    if (!value) return;
    setSelectedPresetDays(days);
    onChange({ ...value, date: addDaysDate(days) });
  };

  const handleRandom = () => {
    if (!value) return;
    setSelectedPresetDays(null);
    onChange({ ...value, date: addDaysDate(getRandomReminderDays()) });
  };

  return (
    <View className="w-full gap-3">
      <View className="flex-row items-center justify-between">
        <Text variant="heading-2" className="text-text-normal">
          리마인드
        </Text>
        <Toggle
          value={value !== null}
          onChange={handleToggle}
          accessibilityLabel="리마인드"
        />
      </View>
      {value === null ? (
        <ReminderOffRow />
      ) : (
        <ReminderOnCard
          presets={PRESETS}
          selectedPresetDays={selectedPresetDays}
          onPreset={handlePreset}
          diceButton={<DiceButton onPress={handleRandom} />}
          dateLabel={formatReminderDate(value.date)}
          remainingLabel={formatRemainingPeriod(value.date)}
          timeLabel={formatReminderTime(value.hour, value.minute)}
          onOpenDate={() => setOpenPicker("date")}
          onOpenTime={() => setOpenPicker("time")}
        />
      )}
      {openPicker === "date" && value && (
        <DatePickerModal
          value={value.date}
          onConfirm={(date) => {
            setSelectedPresetDays(null);
            onChange({ ...value, date });
            setOpenPicker(null);
          }}
          onClose={() => setOpenPicker(null)}
        />
      )}
      {openPicker === "time" && value && (
        <TimePickerModal
          value={{ hour: value.hour, minute: value.minute }}
          onConfirm={(time) => {
            onChange({ ...value, ...time });
            setOpenPicker(null);
          }}
          onClose={() => setOpenPicker(null)}
        />
      )}
    </View>
  );
}

const WIGGLE_SEQUENCE = [15, -12, 8, -4, 0];

interface DiceButtonProps {
  onPress: () => void;
}

function DiceButton({ onPress }: DiceButtonProps) {
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);
  // 웹 전용 hover 툴팁 — 네이티브에선 onHoverIn/Out 이 발화하지 않지만, 정책상 명시적으로도 막는다.
  const [isHovered, setIsHovered] = useState(false);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }, { scale: scale.value }],
  }));

  const handlePress = () => {
    rotate.value = withSequence(
      withTiming(WIGGLE_SEQUENCE[0], { duration: 100 }),
      withTiming(WIGGLE_SEQUENCE[1]),
      withTiming(WIGGLE_SEQUENCE[2]),
      withTiming(WIGGLE_SEQUENCE[3]),
      withTiming(WIGGLE_SEQUENCE[4]),
    );
    scale.value = withSequence(
      withTiming(1.1, { duration: 125 }),
      withTiming(1, { duration: 125 }),
    );
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="랜덤 날짜"
      onPress={handlePress}
      onHoverIn={() => isWeb && setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      className="h-9 items-center justify-center rounded-full bg-opacity-black-30 px-3"
    >
      {isWeb && isHovered && (
        <View
          pointerEvents="none"
          className="absolute bottom-full mb-2 web:w-max items-center rounded-[10px] bg-gray-700 px-3 py-1.5"
        >
          <Text
            variant="label-2-semibold"
            numberOfLines={1}
            className="text-text-strong"
          >
            랜덤 날짜
          </Text>
        </View>
      )}
      <Animated.View style={animatedStyle}>
        <DiceIcon />
      </Animated.View>
    </Pressable>
  );
}
