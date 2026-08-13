import {
  FOLDER_TONE_HEX,
  type SelectableFolderColor,
} from "@shared/folder/folder.constants";
import { Pressable, View } from "react-native";

import { FOLDER_COLOR_OPTIONS, FOLDER_SOLID_CLASS } from "../archive.constants";

// Figma 그리드는 6열 고정이라 wrap 에 맡기지 않고 행을 직접 나눈다
// (폭이 넓어지면 wrap 은 한 행에 7개를 넣어 배치가 깨진다).
const COLUMNS = 6;
const COLOR_ROWS = [
  FOLDER_COLOR_OPTIONS.slice(0, COLUMNS),
  FOLDER_COLOR_OPTIONS.slice(COLUMNS),
];

export interface FolderColorPickerProps {
  value: SelectableFolderColor;
  onChange: (color: SelectableFolderColor) => void;
}

// 12색 스와치 그리드(2행 × 6열). 선택된 색은 같은 색 50% 링으로 감싼다.
export function FolderColorPicker({ value, onChange }: FolderColorPickerProps) {
  return (
    <View className="gap-3">
      {COLOR_ROWS.map((row) => (
        <View key={row[0]} className="flex-row justify-between">
          {row.map((color) => (
            <Swatch
              key={color}
              color={color}
              selected={color === value}
              onPress={() => onChange(color)}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

interface SwatchProps {
  color: SelectableFolderColor;
  selected: boolean;
  onPress: () => void;
}

function Swatch({ color, selected, onPress }: SwatchProps) {
  return (
    <Pressable
      testID={`folder-color-${color}`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className="size-10 items-center justify-center rounded-full border-2"
      // 링 색은 색상마다 다른 동적 값(solid 의 50% 알파)이라 className 으로 못 만든다.
      style={{
        borderColor: selected ? `${FOLDER_TONE_HEX[color]}80` : "transparent",
      }}
    >
      <View className={`size-8 rounded-full ${FOLDER_SOLID_CLASS[color]}`} />
    </Pressable>
  );
}
