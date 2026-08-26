import {
  Bell,
  Calendar,
  ChevronRight,
  Clock,
  Dices,
} from "lucide-react-native";
import { useState } from "react";
import { Pressable, Switch, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { Icon } from "@/components/ui/icon/Icon";
import { Text } from "@/components/ui/text/Text";
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

const TRACK_COLOR = { true: "#fffe66", false: "#3f3f46" };
const THUMB_COLOR = "#ffffff";

export interface ReminderSectionProps {
  value: ReminderValue | null;
  onChange: (value: ReminderValue | null) => void;
}

export function ReminderSection({ value, onChange }: ReminderSectionProps) {
  // 프리셋 선택은 서버로 가지 않는 표시 상태 — 직접 선택·랜덤 시 해제(자동 매칭 없음, 시안 정책).
  const [selectedPresetDays, setSelectedPresetDays] = useState<number | null>(
    null,
  );
  // 주사위로 고른 날짜엔 "랜덤 날짜" 배지를 보여준다(frame-reminder-random 시안) — 프리셋·직접
  // 선택 시엔 꺼진다.
  const [isRandomSelected, setIsRandomSelected] = useState(false);
  const [openPicker, setOpenPicker] = useState<"date" | "time" | null>(null);

  const handleToggle = (isEnabled: boolean) => {
    if (!isEnabled) {
      setSelectedPresetDays(null);
      setIsRandomSelected(false);
      onChange(null);
      return;
    }
    requestReminderPermission(); // 결과 무관 — 거부해도 토글 유지(이메일 알림)
    setSelectedPresetDays(1);
    setIsRandomSelected(false);
    onChange({ date: getTomorrowDate(), ...roundUpToQuarter() });
  };

  const handlePreset = (days: number) => {
    if (!value) return;
    setSelectedPresetDays(days);
    setIsRandomSelected(false);
    onChange({ ...value, date: addDaysDate(days) });
  };

  const handleRandom = () => {
    if (!value) return;
    setSelectedPresetDays(null);
    setIsRandomSelected(true);
    onChange({ ...value, date: addDaysDate(getRandomReminderDays()) });
  };

  return (
    <View className="w-full gap-4">
      <View className="flex-row items-center justify-between">
        <Text variant="heading-3">리마인드</Text>
        <Switch
          value={value !== null}
          onValueChange={handleToggle}
          trackColor={TRACK_COLOR}
          thumbColor={THUMB_COLOR}
        />
      </View>
      {value === null ? (
        <ReminderOffRow />
      ) : (
        <ReminderOnCard
          value={value}
          selectedPresetDays={selectedPresetDays}
          isRandomSelected={isRandomSelected}
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
            setIsRandomSelected(false);
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
    <View className="flex-row items-center gap-2 rounded-[20px] bg-opacity-white-10 p-4">
      <Icon iconNode={Bell} className="text-text-assistive" />
      <Text variant="body-2-normal" className="text-text-assistive">
        잊지 않도록 다시 알려드려요
      </Text>
    </View>
  );
}

interface ReminderOnCardProps {
  value: ReminderValue;
  selectedPresetDays: number | null;
  isRandomSelected: boolean;
  onPreset: (days: number) => void;
  onRandom: () => void;
  onOpenDate: () => void;
  onOpenTime: () => void;
}

function ReminderOnCard({
  value,
  selectedPresetDays,
  isRandomSelected,
  onPreset,
  onRandom,
  onOpenDate,
  onOpenTime,
}: ReminderOnCardProps) {
  return (
    <View className="w-full gap-4 rounded-[20px] bg-opacity-white-10 p-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          <Icon iconNode={Bell} size={14} className="text-text-normal" />
          <Text variant="body-2-normal">언제 알려드릴까요?</Text>
        </View>
        {isRandomSelected && (
          <View className="rounded-[10px] bg-opacity-black-30 px-3 py-1.5">
            <Text variant="body-2-normal">랜덤 날짜</Text>
          </View>
        )}
      </View>
      <View className="flex-row items-center gap-2">
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
      <Pressable
        accessibilityRole="button"
        onPress={onOpenDate}
        className="flex-row items-center gap-2 web:hover:bg-opacity-white-05"
      >
        <Icon iconNode={Calendar} className="text-text-normal" />
        <Text variant="body-2-normal" className="flex-1">
          {formatReminderDate(value.date)}
        </Text>
        <Text variant="caption-1" className="text-icon-accent">
          {formatRemainingPeriod(value.date)}
        </Text>
        <Icon iconNode={ChevronRight} className="text-icon-alternative" />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={onOpenTime}
        className="flex-row items-center gap-2 web:hover:bg-opacity-white-05"
      >
        <Icon iconNode={Clock} className="text-text-normal" />
        <Text variant="body-2-normal" className="flex-1">
          {formatReminderTime(value.hour, value.minute)}
        </Text>
        <Icon iconNode={ChevronRight} className="text-icon-alternative" />
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
      className={`h-10 items-center justify-center rounded-full px-4 ${
        isSelected ? "bg-opacity-white-20" : "bg-opacity-white-10"
      }`}
    >
      <Text variant="body-2-normal">{label}</Text>
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
      className="h-10 w-10 items-center justify-center rounded-full bg-opacity-white-10"
    >
      <Animated.View style={animatedStyle}>
        <Icon iconNode={Dices} className="text-text-normal" />
      </Animated.View>
    </Pressable>
  );
}
