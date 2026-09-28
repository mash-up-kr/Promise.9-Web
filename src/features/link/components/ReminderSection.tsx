import { useReduceMotion } from "@promise9/ui/hooks/useReduceMotion";
import { DiceIcon } from "@promise9/ui/icon/DiceIcon";
import {
  ReminderDiceButton,
  ReminderOffRow,
  ReminderOnCard,
} from "@promise9/ui/reminder-card/ReminderCard";
import { Text } from "@promise9/ui/text/Text";
import { Toggle } from "@promise9/ui/toggle/Toggle";
import { REMINDER_PRESETS } from "@shared/reminder/reminder.constants";
import { useRef, useState } from "react";
import { Animated, Easing, View } from "react-native";
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
          presets={REMINDER_PRESETS}
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

// iOS 공유 익스텐션에서도 쓰여 Reanimated 대신 RN Animated 로 그린다(shareExtension.bundle.test).
// 기존 Reanimated withTiming 기본값(300ms, inOut quad)을 그대로 옮겼다.
function timing(value: Animated.Value, toValue: number, duration = 300) {
  return Animated.timing(value, {
    toValue,
    duration,
    easing: Easing.inOut(Easing.quad),
    // react-native-web 은 native driver 가 없어 켜면 경고만 남긴다.
    useNativeDriver: !isWeb,
  });
}

interface DiceButtonProps {
  onPress: () => void;
}

function DiceButton({ onPress }: DiceButtonProps) {
  const isReduceMotionEnabled = useReduceMotion();
  const rotate = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  // 웹 전용 hover 툴팁 — 네이티브에선 onHoverIn/Out 이 발화하지 않지만, 정책상 명시적으로도 막는다.
  const [isHovered, setIsHovered] = useState(false);

  const animatedStyle = {
    transform: [
      {
        rotate: rotate.interpolate({
          inputRange: [-360, 360],
          outputRange: ["-360deg", "360deg"],
        }),
      },
      { scale },
    ],
  };

  const handlePress = () => {
    if (!isReduceMotionEnabled) {
      Animated.parallel([
        Animated.sequence(
          WIGGLE_SEQUENCE.map((angle, index) =>
            timing(rotate, angle, index === 0 ? 100 : undefined),
          ),
        ),
        Animated.sequence([timing(scale, 1.1, 125), timing(scale, 1, 125)]),
      ]).start();
    }
    onPress();
  };

  return (
    <ReminderDiceButton
      onPress={handlePress}
      onHoverIn={() => isWeb && setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
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
    </ReminderDiceButton>
  );
}
