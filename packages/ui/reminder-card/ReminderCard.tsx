import { Calendar, ChevronRight, Clock } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, type PressableProps, View } from "react-native";
import { isWeb } from "../constants/platform.constants";
import { BellIcon } from "../icon/BellIcon";
import { DiceIcon } from "../icon/DiceIcon";
import { Icon } from "../icon/Icon";
import { tv } from "../lib/tv";
import { Text } from "../text/Text";

const presetChipStyles = tv({
  base: "h-9 items-center justify-center rounded-full px-3",
  variants: {
    isSelected: { true: "bg-opacity-white-80", false: "bg-opacity-black-30" },
  },
});

const presetChipLabelStyles = tv({
  base: "",
  variants: {
    isSelected: { true: "text-gray-900", false: "text-opacity-white-70" },
  },
});

// 시안 벨 색 — 아이콘이 fill 기반이라 토큰 className 대신 raw hex 를 쓴다(BellIcon 주석 참고).
const BELL_ON_COLOR = "#E9E9EB";
const BELL_OFF_COLOR = "#8A8A93";

export function ReminderOffRow() {
  return (
    <View className="w-full flex-row items-center gap-2 rounded-[20px] bg-opacity-white-10 p-4">
      <BellIcon color={BELL_OFF_COLOR} />
      <Text variant="body-2-normal" className="text-text-alternative">
        잊지 않도록 다시 알려드려요
      </Text>
    </View>
  );
}

export interface ReminderPreset {
  days: number;
  label: string;
}

// 값 모델·포맷·프리셋 정책은 표면마다 다르다(앱 ReminderValue+dayjs, 익스텐션 Date) —
// 카드는 포맷이 끝난 라벨과 콜백만 받는다.
export interface ReminderOnCardProps {
  presets: readonly ReminderPreset[];
  selectedPresetDays: number | null;
  onPreset: (days: number) => void;
  /** 프리셋 칩 뒤에 놓는 랜덤 날짜 버튼. 앱은 reanimated 로 흔들어서 표면이 직접 만든다. */
  diceButton: ReactNode;
  dateLabel: string;
  remainingLabel: string;
  timeLabel: string;
  onOpenDate: () => void;
  onOpenTime: () => void;
}

export function ReminderOnCard({
  presets,
  selectedPresetDays,
  onPreset,
  diceButton,
  dateLabel,
  remainingLabel,
  timeLabel,
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
          {presets.map((preset) => (
            <PresetChip
              key={preset.days}
              label={preset.label}
              isSelected={selectedPresetDays === preset.days}
              onPress={() => onPreset(preset.days)}
            />
          ))}
          {diceButton}
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
            {dateLabel}
          </Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Text variant="body-2-normal" className="text-yellow-100">
            {remainingLabel}
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
            {timeLabel}
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

export interface ReminderDiceButtonProps
  extends Pick<PressableProps, "onHoverIn" | "onHoverOut"> {
  onPress: () => void;
  /** 기본은 주사위 아이콘. 앱은 흔들림 애니메이션으로 감싼 아이콘과 hover 툴팁을 넣는다. */
  children?: ReactNode;
}

/** `ReminderOnCard` 의 `diceButton` 자리에 넣는 랜덤 날짜 버튼 — 스킨·라벨은 여기 한 곳에 둔다. */
export function ReminderDiceButton({
  onPress,
  onHoverIn,
  onHoverOut,
  children,
}: ReminderDiceButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="랜덤 날짜"
      onPress={onPress}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      className="h-9 items-center justify-center rounded-full bg-opacity-black-30 px-3"
    >
      {children ?? <DiceIcon />}
    </Pressable>
  );
}

interface PresetChipProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}

function PresetChip({ label, isSelected, onPress }: PresetChipProps) {
  // ARIA 는 button 역할에 aria-selected 를 허용하지 않는다 — 웹은 aria-pressed 로,
  // 네이티브는 RN 이 selected 상태로 옮겨주는 aria-selected 로 알린다.
  const selectionProps = isWeb
    ? { "aria-pressed": isSelected }
    : { "aria-selected": isSelected };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      {...selectionProps}
      onPress={onPress}
      className={presetChipStyles({ isSelected })}
    >
      <Text
        variant="label-2-semibold"
        className={presetChipLabelStyles({ isSelected })}
      >
        {label}
      </Text>
    </Pressable>
  );
}
