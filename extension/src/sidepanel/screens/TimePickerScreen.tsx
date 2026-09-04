import { useState } from "react";

import { MINUTE_STEP, withTime } from "@/lib/remind";
import { ActionButton } from "@/sidepanel/components/ActionButton";
import { WheelColumn, WheelPicker } from "@/sidepanel/components/WheelPicker";

const MERIDIEMS = ["오전", "오후"] as const;
const HOURS = Array.from({ length: 12 }, (_, index) => index + 1);
const MINUTES = Array.from(
  { length: 60 / MINUTE_STEP },
  (_, index) => index * MINUTE_STEP,
);

type Meridiem = (typeof MERIDIEMS)[number];

export interface TimePickerScreenProps {
  value: Date;
  onCancel: () => void;
  onConfirm: (value: Date) => void;
}

/** 시안 `chrome-extension / time picker`. */
export function TimePickerScreen({
  value,
  onCancel,
  onConfirm,
}: TimePickerScreenProps) {
  const [meridiem, setMeridiem] = useState<Meridiem>(
    value.getHours() < 12 ? "오전" : "오후",
  );
  const [hour12, setHour12] = useState(
    value.getHours() % 12 === 0 ? 12 : value.getHours() % 12,
  );
  const [minute, setMinute] = useState(
    // 15분 단위 휠이라 그 사이 값은 가장 가까운 눈금으로 맞춘다.
    Math.round(value.getMinutes() / MINUTE_STEP) * MINUTE_STEP,
  );

  const confirm = () => {
    // 12시는 오전이면 0시, 오후면 12시다.
    const base = hour12 % 12;
    const hours = meridiem === "오전" ? base : base + 12;

    onConfirm(withTime(value, hours, minute % 60));
  };

  return (
    <div className="flex h-full flex-col justify-center px-4 py-6">
      <div className="mx-auto w-full max-w-100">
        <h1 className="text-center text-heading-3 text-text-strong">
          시간 선택
        </h1>

        <div className="mt-8">
          <WheelPicker>
            <WheelColumn
              label="오전 오후"
              options={MERIDIEMS}
              value={meridiem}
              onChange={setMeridiem}
            />
            <WheelColumn
              label="시"
              options={HOURS}
              value={hour12}
              onChange={setHour12}
            />
            <WheelColumn
              label="분"
              options={MINUTES}
              value={minute}
              onChange={setMinute}
              format={(option) => String(option).padStart(2, "0")}
            />
          </WheelPicker>
        </div>

        <div className="mt-8 flex gap-2">
          <ActionButton variant="secondary" onClick={onCancel}>
            취소
          </ActionButton>
          <ActionButton onClick={confirm}>확인</ActionButton>
        </div>
      </div>
    </div>
  );
}
