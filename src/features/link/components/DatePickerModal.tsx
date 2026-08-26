import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useState } from "react";
import { Modal, Pressable, View } from "react-native";

import { ActionButton } from "@/components/ui/action-button/ActionButton";
import { Dialog } from "@/components/ui/dialog/Dialog";
import { Icon } from "@/components/ui/icon/Icon";
import { Text } from "@/components/ui/text/Text";
import { WheelPicker } from "@/components/ui/wheel-picker/WheelPicker";
import {
  getCalendarWeeks,
  getReminderDateRange,
} from "@/features/link/reminder.utils";
import { dayjs } from "@/lib/dayjs";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

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
  const range = getReminderDateRange();
  const minMonth = range.min.slice(0, 7);
  const maxMonth = range.max.slice(0, 7);
  const minYear = Number(range.min.slice(0, 4));
  const maxYear = Number(range.max.slice(0, 4));
  const minMonthNum = Number(range.min.slice(5, 7));
  const maxMonthNum = Number(range.max.slice(5, 7));

  const [mode, setMode] = useState<"calendar" | "wheel">("calendar");
  const [draftDate, setDraftDate] = useState(value);
  const [viewMonth, setViewMonth] = useState(value.slice(0, 7));
  const [wheelYear, setWheelYear] = useState(Number(value.slice(0, 4)));
  const [wheelMonth, setWheelMonth] = useState(Number(value.slice(5, 7)));

  const today = dayjs().format("YYYY-MM-DD");
  const isDisabledDate = (date: string) => date < range.min || date > range.max;

  const goMonth = (delta: number) => {
    const next = dayjs(`${viewMonth}-01`).add(delta, "month").format("YYYY-MM");
    if (next >= minMonth && next <= maxMonth) setViewMonth(next);
  };

  const openWheel = () => {
    setWheelYear(Number(viewMonth.slice(0, 4)));
    setWheelMonth(Number(viewMonth.slice(5, 7)));
    setMode("wheel");
  };

  const changeWheelYear = (year: number) => {
    setWheelYear(year);
    const from = year === minYear ? minMonthNum : 1;
    const to = year === maxYear ? maxMonthNum : 12;
    setWheelMonth((month) => Math.min(Math.max(month, from), to));
  };

  const confirm = () => {
    if (mode === "calendar") {
      onConfirm(draftDate);
      return;
    }
    setViewMonth(`${wheelYear}-${String(wheelMonth).padStart(2, "0")}`);
    setMode("calendar");
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
          {mode === "calendar" ? (
            <CalendarView
              viewMonth={viewMonth}
              draftDate={draftDate}
              today={today}
              isDisabledDate={isDisabledDate}
              onSelectDate={setDraftDate}
              onPrevMonth={() => goMonth(-1)}
              onNextMonth={() => goMonth(1)}
              onOpenWheel={openWheel}
            />
          ) : (
            <YearMonthWheel
              minYear={minYear}
              maxYear={maxYear}
              minMonthNum={minMonthNum}
              maxMonthNum={maxMonthNum}
              wheelYear={wheelYear}
              wheelMonth={wheelMonth}
              onChangeYear={changeWheelYear}
              onChangeMonth={setWheelMonth}
            />
          )}
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
  return (
    <View className="h-11 flex-1 items-center gap-1">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${day}일`}
        disabled={disabled}
        onPress={onPress}
        className={`size-9 items-center justify-center rounded-full ${isSelected ? "bg-yellow-300" : ""}`}
      >
        <Text
          variant="body-2-normal"
          className={
            isSelected
              ? "text-gray-900"
              : disabled
                ? "text-gray-600"
                : "text-text-strong"
          }
        >
          {day}
        </Text>
      </Pressable>
      <View
        className={`size-1 rounded-full ${isToday ? "bg-yellow-300" : "bg-transparent"}`}
      />
    </View>
  );
}

interface YearMonthWheelProps {
  minYear: number;
  maxYear: number;
  minMonthNum: number;
  maxMonthNum: number;
  wheelYear: number;
  wheelMonth: number;
  onChangeYear: (year: number) => void;
  onChangeMonth: (month: number) => void;
}

function YearMonthWheel({
  minYear,
  maxYear,
  minMonthNum,
  maxMonthNum,
  wheelYear,
  wheelMonth,
  onChangeYear,
  onChangeMonth,
}: YearMonthWheelProps) {
  const yearItems = Array.from({ length: maxYear - minYear + 1 }, (_, i) => {
    const year = minYear + i;
    return { value: year, label: `${year}년` };
  });

  const monthFrom = wheelYear === minYear ? minMonthNum : 1;
  const monthTo = wheelYear === maxYear ? maxMonthNum : 12;
  const monthItems = Array.from({ length: monthTo - monthFrom + 1 }, (_, i) => {
    const month = monthFrom + i;
    return { value: month, label: `${month}월` };
  });

  return (
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
  );
}
