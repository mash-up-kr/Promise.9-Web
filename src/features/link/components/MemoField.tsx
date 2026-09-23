import {
  BottomSheetTextInput,
  useBottomSheetInternal,
} from "@gorhom/bottom-sheet";
import type { TextInput } from "react-native";

import { MemoFieldBase, type MemoFieldBaseProps } from "./MemoFieldBase";

export type MemoFieldProps = Omit<MemoFieldBaseProps, "Input">;

export function MemoField(props: MemoFieldProps) {
  // gorhom 은 BottomSheetTextInput 이 포커스를 알려줘야 키보드에 맞춰 시트를 올린다 —
  // 시트 안에서만 그 입력을 쓰고, 상세 화면처럼 시트 밖에서는 일반 TextInput 을 유지한다.
  // BottomSheetTextInput 은 RN TextInput 의 props·ref 를 그대로 넘기므로 같은 타입으로 다룬다.
  const isInsideSheet = Boolean(useBottomSheetInternal(true));
  return (
    <MemoFieldBase
      {...props}
      Input={
        isInsideSheet
          ? (BottomSheetTextInput as unknown as typeof TextInput)
          : undefined
      }
    />
  );
}
