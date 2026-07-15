import Svg, { Path } from "react-native-svg";

export interface TooltipArrowIconProps {
  width?: number;
  height?: number;
}

export function TooltipArrowIcon({
  width = 8,
  height = 8.30742,
}: TooltipArrowIconProps) {
  return (
    // Figma 원본 폴리곤은 위를 향한다. 툴팁 말풍선이 카드 위에 뜨므로
    // 꼬리는 아래(카드)를 가리켜야 해 180도 뒤집는다.
    <Svg
      width={width}
      height={height}
      viewBox="0 0 8 8.30742"
      fill="none"
      style={{ transform: [{ rotate: "180deg" }] }}
    >
      <Path
        d="M3.07152 0.62861C3.40678 -0.209536 4.59322 -0.209537 4.92848 0.628609L8 8.30742H0L3.07152 0.62861Z"
        fill="white"
        fillOpacity={0.6}
      />
    </Svg>
  );
}
