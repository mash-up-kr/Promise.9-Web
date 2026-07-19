import {
  Radio,
  RadioGroup,
  RadioIcon,
  RadioIndicator,
  RadioLabel,
} from "@/components/ui/radio/Radio";
import { Text } from "@/components/ui/text/Text";
import { VStack } from "@/components/ui/vstack/VStack";
import {
  REMIND_OPTIONS,
  type RemindType,
} from "@/features/link/link.constants";

export interface RemindQuestionSectionProps {
  value: RemindType | null;
  onChange: (value: RemindType) => void;
}

export function RemindQuestionSection({
  value,
  onChange,
}: RemindQuestionSectionProps) {
  return (
    <VStack space="sm">
      <Text variant="label-1" className="px-1 text-text-strong">
        이 링크는 언제 다시 필요할까요?
        <Text variant="label-1" className="text-folder-red-solid">
          {" *"}
        </Text>
      </Text>
      <RadioGroup
        value={value}
        onChange={(v) => onChange(v as RemindType)}
        className="w-full gap-1 rounded-[20px] bg-opacity-white-10 px-4 py-[11px]"
      >
        {REMIND_OPTIONS.map((option) => (
          <Radio key={option.value} value={option.value}>
            <RadioIndicator>
              <RadioIcon />
            </RadioIndicator>
            <RadioLabel>{option.label}</RadioLabel>
          </Radio>
        ))}
      </RadioGroup>
    </VStack>
  );
}
