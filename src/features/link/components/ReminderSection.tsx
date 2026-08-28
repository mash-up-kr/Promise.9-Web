import { Calendar, ChevronRight, Clock } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { BellIcon } from "@/components/ui/icon/BellIcon";
import { DiceIcon } from "@/components/ui/icon/DiceIcon";
import { Icon } from "@/components/ui/icon/Icon";
import { Text } from "@/components/ui/text/Text";
import { Toggle } from "@/components/ui/toggle/Toggle";
import { isWeb } from "@/constants/platform.constants";
import { requestReminderPermission } from "@/features/link/reminder.permissions";
import {
  addDaysDate,
  formatRemainingPeriod,
  formatReminderDate,
  formatReminderTime,
  getRandomReminderDays,
  getTomorrowDate,
  type ReminderValue,
  roundUpToQuarter,
} from "@/features/link/reminder.utils";

import { DatePickerModal } from "./DatePickerModal";
import { TimePickerModal } from "./TimePickerModal";

const PRESETS = [
  { days: 1, label: "내일" },
  { days: 3, label: "3일 후" },
  { days: 7, label: "7일 후" },
  { days: 14, label: "14일 후" },
];

// 시안 벨 색 — 아이콘이 fill 기반이라 토큰 className 대신 raw hex 를 쓴다(BellIcon 주석 참고).
const BELL_ON_COLOR = "#E9E9EB";
const BELL_OFF_COLOR = "#8A8A93";

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
    requestReminderPermission(); // 결과 무관 — 거부해도 토글 유지(이메일 알림)
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
          value={value}
          selectedPresetDays={selectedPresetDays}
          onPreset={handlePreset}
          onRandom={handleRandom}
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

function ReminderOffRow() {
  return (
    <View className="w-full flex-row items-center gap-2 rounded-[20px] bg-opacity-white-10 p-4">
      <BellIcon color={BELL_OFF_COLOR} />
      <Text variant="body-2-normal" className="text-text-alternative">
        잊지 않도록 다시 알려드려요
      </Text>
    </View>
  );
}

interface ReminderOnCardProps {
  value: ReminderValue;
  selectedPresetDays: number | null;
  onPreset: (days: number) => void;
  onRandom: () => void;
  onOpenDate: () => void;
  onOpenTime: () => void;
}

function ReminderOnCard({
  value,
  selectedPresetDays,
  onPreset,
  onRandom,
  onOpenDate,
  onOpenTime,
}: ReminderOnCardProps) {
  return (
    <View className="w-full rounded-[20px] bg-opacity-white-10">
      <View className="gap-4 px-4 pt-4">
        <View className="flex-row items-center gap-2">
          <BellIcon color={BELL_ON_COLOR} />
          <Text variant="body-2-normal" className="text-text-normal">
            언제 알려드릴까요?
          </Text>
        </View>
        <View className="flex-row flex-wrap items-center gap-1">
          {PRESETS.map((preset) => (
            <PresetChip
              key={preset.days}
              label={preset.label}
              isSelected={selectedPresetDays === preset.days}
              onPress={() => onPreset(preset.days)}
            />
          ))}
          <DiceButton onPress={onRandom} />
        </View>
        <View className="h-px w-full bg-opacity-white-10" />
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onOpenDate}
        className="h-13 flex-row items-start justify-between px-4 pt-4 web:hover:bg-opacity-white-05"
      >
        <View className="flex-row items-center gap-2">
          <Icon iconNode={Calendar} size={16} className="text-icon-normal" />
          <Text variant="body-2-normal" className="text-text-normal">
            {formatReminderDate(value.date)}
          </Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Text variant="body-2-normal" className="text-yellow-100">
            {formatRemainingPeriod(value.date)}
          </Text>
          <Icon
            iconNode={ChevronRight}
            size={16}
            className="text-icon-alternative"
          />
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={onOpenTime}
        className="h-13 flex-row items-end justify-between rounded-b-[20px] px-4 pt-2.5 pb-4 web:hover:bg-opacity-white-05"
      >
        <View className="flex-row items-center gap-2">
          <Icon iconNode={Clock} size={16} className="text-icon-normal" />
          <Text variant="body-2-normal" className="text-text-normal">
            {formatReminderTime(value.hour, value.minute)}
          </Text>
        </View>
        <Icon
          iconNode={ChevronRight}
          size={16}
          className="text-icon-alternative"
        />
      </Pressable>
    </View>
  );
}

interface PresetChipProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}

function PresetChip({ label, isSelected, onPress }: PresetChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className={`h-9 items-center justify-center rounded-full px-3 ${
        isSelected ? "bg-opacity-white-80" : "bg-opacity-black-30"
      }`}
    >
      <Text
        variant="label-2-semibold"
        className={isSelected ? "text-gray-900" : "text-opacity-white-70"}
      >
        {label}
      </Text>
    </Pressable>
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
