import {
  BottomSheetTextInput,
  useBottomSheetInternal,
} from "@gorhom/bottom-sheet";
import { type RefAttributes, useCallback, useMemo } from "react";
import type { TextInput, TextInputProps } from "react-native";
import { mergeRefs } from "react-simplikit";

import { MemoFieldBase, type MemoFieldBaseProps } from "./MemoFieldBase";

export type MemoFieldProps = Omit<MemoFieldBaseProps, "Input">;

export function MemoField(props: MemoFieldProps) {
  // gorhom 은 BottomSheetTextInput 이 포커스를 알려줘야 키보드에 맞춰 시트를 올린다 —
  // 시트 안에서만 그 입력을 쓰고, 상세 화면처럼 시트 밖에서는 일반 TextInput 을 유지한다.
  const isInsideSheet = Boolean(useBottomSheetInternal(true));
  return (
    <MemoFieldBase
      {...props}
      Input={isInsideSheet ? SheetTextInput : undefined}
    />
  );
}

// gorhom 은 ref 를 `TextInput | undefined` 로 선언해 RN TextInput 의 ref 와 타입이 어긋난다 —
// RN TextInput 과 같은 계약(props·ref)으로 감싸 넘긴다.
export function SheetTextInput({
  ref,
  ...props
}: TextInputProps & RefAttributes<TextInput>) {
  const mergedRef = useMemo(() => mergeRefs(ref), [ref]);
  const handleRef = useCallback(
    (node: TextInput | null | undefined) => mergedRef(node ?? null),
    [mergedRef],
  );
  return <BottomSheetTextInput {...props} ref={handleRef} />;
}
