import { Pressable, View } from "react-native";

import {
  FOLDER_COLOR_OPTIONS,
  FOLDER_SOLID_CLASS,
  type SelectableFolderColor,
} from "../archive.constants";

export interface FolderColorPickerProps {
  value: SelectableFolderColor;
  onChange: (color: SelectableFolderColor) => void;
}

// 12색 스와치 그리드(2행 × 6열). 선택된 색은 같은 색 링으로 감싼다.
export function FolderColorPicker({ value, onChange }: FolderColorPickerProps) {
  return (
    <View className="flex-row flex-wrap gap-x-[14px] gap-y-4">
      {FOLDER_COLOR_OPTIONS.map((color) => (
        <Swatch
          key={color}
          color={color}
          selected={color === value}
          onPress={() => onChange(color)}
        />
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
  const solid = FOLDER_SOLID_CLASS[color];
  return (
    <Pressable
      testID={`folder-color-${color}`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className="h-11 w-11 items-center justify-center rounded-full"
    >
      {selected ? (
        <View
          className={`h-11 w-11 items-center justify-center rounded-full ${solid}`}
        >
          <View className="h-[38px] w-[38px] items-center justify-center rounded-full bg-background-base">
            <View className={`h-8 w-8 rounded-full ${solid}`} />
          </View>
        </View>
      ) : (
        <View className={`h-8 w-8 rounded-full ${solid}`} />
      )}
    </Pressable>
  );
}
