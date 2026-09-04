import { clamp } from "es-toolkit";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react-native";
import { useReducer } from "react";
import { Modal, Pressable, View } from "react-native";
import { SwitchCase } from "react-simplikit";

import { ActionButton } from "@/components/ui/action-button/ActionButton";
import { Dialog } from "@/components/ui/dialog/Dialog";
import { Icon } from "@/components/ui/icon/Icon";
import { Text } from "@/components/ui/text/Text";
import { WheelPicker } from "@/components/ui/wheel-picker/WheelPicker";
import { getReminderDateRange } from "@/features/link/reminder.utils";
import { dayjs } from "@/lib/dayjs";
import { tv } from "@/lib/tv";
import { getCalendarWeeks } from "@/utils/datetime";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

interface PickerState {
  mode: "calendar" | "wheel";
  draftDate: string; // YYYY-MM-DD — 확인 전까지의 선택값
  viewMonth: string; // YYYY-MM — 캘린더가 보여주는 달
  wheelYear: number;
  wheelMonth: number;
  /** 선택 가능 범위 — 마운트 시점에 고정해 자정 경계에서도 셀 상태가 흔들리지 않게 한다. */
  range: { min: string; max: string };
}

type PickerAction =
  | { type: "moveMonth"; delta: -1 | 1 }
  | { type: "selectDate"; date: string }
  | { type: "openWheel" }
  | { type: "setWheelYear"; year: number }
  | { type: "setWheelMonth"; month: number }
  | { type: "confirmWheel" };

function getWheelMonthBounds(state: PickerState, year: number) {
  const from =
    year === Number(state.range.min.slice(0, 4))
      ? Number(state.range.min.slice(5, 7))
      : 1;
  const to =
    year === Number(state.range.max.slice(0, 4))
      ? Number(state.range.max.slice(5, 7))
      : 12;
  return { from, to };
}

// 상태 전이를 한 곳에 모아 "viewMonth·wheelMonth 는 항상 범위 내" 불변식을 리듀서가 지킨다.
function pickerReducer(state: PickerState, action: PickerAction): PickerState {
  switch (action.type) {
    case "moveMonth": {
      const next = dayjs(`${state.viewMonth}-01`)
        .add(action.delta, "month")
        .format("YYYY-MM");
      const isInRange =
        next >= state.range.min.slice(0, 7) &&
        next <= state.range.max.slice(0, 7);
      return isInRange ? { ...state, viewMonth: next } : state;
    }
    case "selectDate":
      return { ...state, draftDate: action.date };
    case "openWheel":
      return {
        ...state,
        mode: "wheel",
        wheelYear: Number(state.viewMonth.slice(0, 4)),
        wheelMonth: Number(state.viewMonth.slice(5, 7)),
      };
    case "setWheelYear": {
      const { from, to } = getWheelMonthBounds(state, action.year);
      return {
        ...state,
        wheelYear: action.year,
        wheelMonth: clamp(state.wheelMonth, from, to),
      };
    }
    case "setWheelMonth":
      return { ...state, wheelMonth: action.month };
    case "confirmWheel":
      return {
        ...state,
        mode: "calendar",
        viewMonth: `${state.wheelYear}-${String(state.wheelMonth).padStart(2, "0")}`,
      };
  }
}

function createInitialState(value: string): PickerState {
  return {
    mode: "calendar",
    draftDate: value,
    viewMonth: value.slice(0, 7),
    wheelYear: Number(value.slice(0, 4)),
    wheelMonth: Number(value.slice(5, 7)),
    range: getReminderDateRange(),
  };
}

export interface DatePickerModalProps {
  value: string;
  onConfirm: (date: string) => void;
  onClose: () => void;
}

export function DatePickerModal({
  value,
  onConfirm,
  onClose,
}: DatePickerModalProps) {
  const [state, dispatch] = useReducer(
    pickerReducer,
    value,
    createInitialState,
  );

  const today = dayjs().format("YYYY-MM-DD");
  const isDisabledDate = (date: string) =>
    date < state.range.min || date > state.range.max;

  const confirm = () => {
    if (state.mode === "calendar") {
      onConfirm(state.draftDate);
      return;
    }
    dispatch({ type: "confirmWheel" });
  };

  return (
    <Modal
      transparent
      statusBarTranslucent
      visible
      animationType="fade"
      onRequestClose={onClose}
    >
      <Dialog onDismiss={onClose}>
        <View className="w-full max-w-[335px] gap-5 rounded-[36px] border border-opacity-white-05 bg-gray-800 p-5">
          <Text variant="heading-2" className="text-center text-text-strong">
            날짜 선택
          </Text>
          <SwitchCase
            value={state.mode}
            caseBy={{
              calendar: () => (
                <CalendarView
                  viewMonth={state.viewMonth}
                  draftDate={state.draftDate}
                  today={today}
                  isDisabledDate={isDisabledDate}
                  onSelectDate={(date) =>
                    dispatch({ type: "selectDate", date })
                  }
                  onPrevMonth={() => dispatch({ type: "moveMonth", delta: -1 })}
                  onNextMonth={() => dispatch({ type: "moveMonth", delta: 1 })}
                  onOpenWheel={() => dispatch({ type: "openWheel" })}
                />
              ),
              wheel: () => (
                <YearMonthWheel
                  range={state.range}
                  wheelYear={state.wheelYear}
                  wheelMonth={state.wheelMonth}
                  onChangeYear={(year) =>
                    dispatch({ type: "setWheelYear", year })
                  }
                  onChangeMonth={(month) =>
                    dispatch({ type: "setWheelMonth", month })
                  }
                />
              ),
            }}
          />
          <View className="flex-row gap-2">
            <ActionButton
              variant="assistive"
              className="flex-1"
              onPress={onClose}
            >
              취소
            </ActionButton>
            <ActionButton
              variant="primary"
              className="flex-1"
              onPress={confirm}
            >
              확인
            </ActionButton>
          </View>
        </View>
      </Dialog>
    </Modal>
  );
}

interface CalendarViewProps {
  viewMonth: string;
  draftDate: string;
  today: string;
  isDisabledDate: (date: string) => boolean;
  onSelectDate: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onOpenWheel: () => void;
}

function CalendarView({
  viewMonth,
  draftDate,
  today,
  isDisabledDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onOpenWheel,
}: CalendarViewProps) {
  const year = viewMonth.slice(0, 4);
  const month = Number(viewMonth.slice(5, 7));
  const weeks = getCalendarWeeks(viewMonth);

  return (
    <View className="gap-4">
      <View className="flex-row items-center justify-between">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="연/월 선택"
          onPress={onOpenWheel}
          className="flex-row items-center gap-1"
        >
          <Text variant="heading-3" className="text-text-strong">
            {year}년 {month}월
          </Text>
          <Icon
            iconNode={ChevronRight}
            className="text-text-strong"
            size={16}
          />
        </Pressable>
        <View className="flex-row gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="이전 달"
            onPress={onPrevMonth}
          >
            <Icon iconNode={ChevronLeft} className="text-text-strong" />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="다음 달"
            onPress={onNextMonth}
          >
            <Icon iconNode={ChevronRight} className="text-text-strong" />
          </Pressable>
        </View>
      </View>
      <View className="flex-row">
        {WEEKDAY_LABELS.map((label) => (
          <View key={label} className="flex-1 items-center">
            <Text variant="caption-2" className="text-text-assistive">
              {label}
            </Text>
          </View>
        ))}
      </View>
      {weeks.map((week, weekIndex) => (
        <View key={`week-${weekIndex}`} className="flex-row">
          {week.map((date, cellIndex) =>
            date ? (
              <DateCell
                key={date}
                date={date}
                isSelected={date === draftDate}
                isToday={date === today}
                disabled={isDisabledDate(date)}
                onPress={() => onSelectDate(date)}
              />
            ) : (
              <View key={`empty-${cellIndex}`} className="h-11 flex-1" />
            ),
          )}
        </View>
      ))}
    </View>
  );
}

const dateCellStyles = tv({
  base: "size-9 items-center justify-center rounded-full",
  variants: {
    isSelected: { true: "bg-yellow-300", false: "" },
  },
});

const dateCellLabelStyles = tv({
  base: "",
  variants: {
    tone: {
      selected: "text-gray-900",
      disabled: "text-gray-600",
      default: "text-text-strong",
    },
  },
});

const todayDotStyles = tv({
  base: "size-1 rounded-full",
  variants: {
    isToday: { true: "bg-yellow-300", false: "bg-transparent" },
  },
});

interface DateCellProps {
  date: string;
  isSelected: boolean;
  isToday: boolean;
  disabled: boolean;
  onPress: () => void;
}

function DateCell({
  date,
  isSelected,
  isToday,
  disabled,
  onPress,
}: DateCellProps) {
  const day = Number(date.slice(8, 10));
  const tone = isSelected ? "selected" : disabled ? "disabled" : "default";
  return (
    <View className="h-11 flex-1 items-center gap-1">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${day}일`}
        disabled={disabled}
        onPress={onPress}
        className={dateCellStyles({ isSelected })}
      >
        <Text variant="body-2-normal" className={dateCellLabelStyles({ tone })}>
          {day}
        </Text>
      </Pressable>
      <View className={todayDotStyles({ isToday })} />
    </View>
  );
}

interface YearMonthWheelProps {
  range: { min: string; max: string };
  wheelYear: number;
  wheelMonth: number;
  onChangeYear: (year: number) => void;
  onChangeMonth: (month: number) => void;
}

function YearMonthWheel({
  range,
  wheelYear,
  wheelMonth,
  onChangeYear,
  onChangeMonth,
}: YearMonthWheelProps) {
  const minYear = Number(range.min.slice(0, 4));
  const maxYear = Number(range.max.slice(0, 4));
  const yearItems = Array.from({ length: maxYear - minYear + 1 }, (_, i) => {
    const year = minYear + i;
    return { value: year, label: `${year}년` };
  });

  const monthFrom = wheelYear === minYear ? Number(range.min.slice(5, 7)) : 1;
  const monthTo = wheelYear === maxYear ? Number(range.max.slice(5, 7)) : 12;
  const monthItems = Array.from({ length: monthTo - monthFrom + 1 }, (_, i) => {
    const month = monthFrom + i;
    return { value: month, label: `${month}월` };
  });

  return (
    <View className="gap-4">
      <View className="flex-row items-center gap-1">
        <Text variant="heading-3" className="text-text-strong">
          {wheelYear}년 {wheelMonth}월
        </Text>
        <Icon iconNode={ChevronDown} className="text-text-strong" size={16} />
      </View>
      <View className="flex-row gap-2">
        <View className="flex-1">
          <WheelPicker
            items={yearItems}
            selectedValue={wheelYear}
            onChange={onChangeYear}
            testID="wheel-year"
          />
        </View>
        <View className="flex-1">
          <WheelPicker
            items={monthItems}
            selectedValue={wheelMonth}
            onChange={onChangeMonth}
            testID="wheel-month"
          />
        </View>
      </View>
    </View>
  );
}
