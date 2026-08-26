import { useState } from "react";
import { Modal, View } from "react-native";

import { ActionButton } from "@/components/ui/action-button/ActionButton";
import { Dialog } from "@/components/ui/dialog/Dialog";
import { Text } from "@/components/ui/text/Text";
import { WheelPicker } from "@/components/ui/wheel-picker/WheelPicker";
import {
  type Meridiem,
  to12Hour,
  to24Hour,
} from "@/features/link/reminder.utils";

const MERIDIEM_ITEMS = [
  { value: "오전", label: "오전" },
  { value: "오후", label: "오후" },
] as const;
const HOUR_ITEMS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: String(i + 1),
}));
const MINUTE_ITEMS = [0, 15, 30, 45].map((minute) => ({
  value: minute,
  label: String(minute).padStart(2, "0"),
}));

export interface TimePickerModalProps {
  value: { hour: number; minute: number };
  onConfirm: (value: { hour: number; minute: number }) => void;
  onClose: () => void;
}

export function TimePickerModal({
  value,
  onConfirm,
  onClose,
}: TimePickerModalProps) {
  const initial = to12Hour(value.hour);
  const [meridiem, setMeridiem] = useState<Meridiem>(initial.meridiem);
  const [hour12, setHour12] = useState(initial.hour12);
  const [minute, setMinute] = useState(value.minute);

  const confirm = () => {
    onConfirm({ hour: to24Hour(meridiem, hour12), minute });
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
        <View className="w-full max-w-[335px] gap-6 rounded-[36px] border border-opacity-white-05 bg-gray-800 p-5">
          <Text variant="heading-2" className="text-center text-text-strong">
            시간 선택
          </Text>
          <View className="flex-row gap-2">
            <View className="flex-1">
              <WheelPicker
                items={[...MERIDIEM_ITEMS]}
                selectedValue={meridiem}
                onChange={setMeridiem}
                testID="wheel-meridiem"
              />
            </View>
            <View className="flex-1">
              <WheelPicker
                items={HOUR_ITEMS}
                selectedValue={hour12}
                onChange={setHour12}
                testID="wheel-hour"
              />
            </View>
            <View className="flex-1">
              <WheelPicker
                items={MINUTE_ITEMS}
                selectedValue={minute}
                onChange={setMinute}
                testID="wheel-minute"
              />
            </View>
          </View>
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
