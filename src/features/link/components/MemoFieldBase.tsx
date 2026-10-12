import { Text } from "@promise9/ui/text/Text";
import {
  type ComponentType,
  type RefAttributes,
  useLayoutEffect,
  useRef,
} from "react";
import { TextInput, type TextInputProps, View } from "react-native";
import { isShareExtension, isWeb } from "@/constants/platform.constants";

import { MEMO_MAX_LENGTH } from "../link.contracts";

const PLACEHOLDER = "저장한 이유나 기억하고 싶은 점을 적어보세요";

export interface MemoFieldBaseProps {
  memo: string;
  onChangeMemo: (value: string) => void;
  /** 포커스 해제 시 — 자동 저장 트리거에 쓴다. */
  onBlur?: () => void;
  /** 입력 컴포넌트 — gorhom 시트 안에서는 BottomSheetTextInput 을 넘긴다(MemoField). */
  Input?: ComponentType<TextInputProps & RefAttributes<TextInput>>;
}

// gorhom 을 import 하지 않는 메모 입력 — iOS 공유 익스텐션은 이것을 그대로 쓴다.
export function MemoFieldBase({
  memo,
  onChangeMemo,
  onBlur,
  Input = TextInput,
}: MemoFieldBaseProps) {
  const inputRef = useRef<TextInput>(null);

  // web(react-native-web)의 <textarea>는 내용이 늘어도 자동으로 커지지 않아 직접
  // 리사이즈한다.
  // biome-ignore lint/correctness/useExhaustiveDependencies: memo 를 직접 읽지 않고 ref 로 DOM 을 재측정하는 트리거로만 쓴다 — 값이 바뀔 때마다 다시 실행돼야 한다.
  useLayoutEffect(() => {
    if (!isWeb) return;
    // react-native-web 은 여러 줄 입력을 <textarea> 로 그린다.
    const node = inputRef.current;
    if (!(node instanceof HTMLTextAreaElement)) return;
    node.style.height = "auto";
    node.style.height = `${node.scrollHeight}px`;
  }, [memo]);

  return (
    <View className="gap-3">
      <Text variant="heading-2">메모</Text>
      <View className="w-full gap-2">
        {/* 입력 박스 — 최소 2줄(72px). 카운터는 박스 밖에 둔다(Figma 106:11562). */}
        <View className="min-h-[72px] w-full rounded-[20px] bg-opacity-white-10 p-4">
          <Input
            ref={inputRef}
            multiline
            value={memo}
            onChangeText={onChangeMemo}
            onBlur={onBlur}
            placeholder={PLACEHOLDER}
            maxLength={MEMO_MAX_LENGTH}
            // placeholderTextColor 는 className 으로 못 받아 리터럴로 지정 — #ffffff4d = --color-opacity-white-30
            placeholderTextColor="#ffffff4d"
            // iOS 공유 익스텐션 폰트 배율 버그 우회 — ui/Text 와 동일
            allowFontScaling={isShareExtension() ? false : undefined}
            // TODO: 저장 트리거(디바운스/blur) 정책은 백엔드 연동 확정 후 결정 —
            // 지금은 상위 계획 스코프(mock + 로컬 state)에 따라 키 입력마다 즉시 반영한다.
            className="min-h-5 w-full font-pretendard text-body-2-reading text-text-normal web:outline-none"
            // iOS 상단 여백 이슈 우회
            style={{ verticalAlign: "top", padding: 0 }}
          />
        </View>
        {/* 카운터는 항상 노출한다(Figma: 글자수 카운터 항상 노출). */}
        <View className="w-full flex-row justify-end px-1">
          <Text variant="caption-2" className="text-text-alternative">
            {memo.length}/{MEMO_MAX_LENGTH}
          </Text>
        </View>
      </View>
    </View>
  );
}
