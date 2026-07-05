import type { SvgProps } from "react-native-svg";

// Icon(래퍼)이 className 색상을 `color`(=currentColor) 로, `size` 를 그대로 넘긴다.
// 각 아이콘은 size 를 width/height 로 매핑하고 나머지 SvgProps 는 스프레드한다.
export type SvgIconProps = SvgProps & {
  size?: string | number;
};
