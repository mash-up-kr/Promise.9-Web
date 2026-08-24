import Svg, { Path, type SvgProps } from "react-native-svg";

export interface KakaoIconProps extends SvgProps {}

// Figma Icon/Kakao — 브랜드 아이콘이라 색은 고정(black, opacity 0.902). 버튼 dim 은 부모 opacity 로 처리.
export function KakaoIcon({
  width = 24,
  height = 24,
  ...props
}: KakaoIconProps) {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      accessibilityRole="image"
      accessibilityLabel="카카오"
      {...props}
    >
      <Path
        testID="kakao-glyph"
        fillRule="evenodd"
        clipRule="evenodd"
        opacity={0.902}
        d="M12 4C7.29 4 3 7.81088 3 11.0349C3 13.4507 4.558 15.5816 6.931 16.8479L5.933 20.538C5.844 20.8651 6.213 21.1248 6.496 20.9366L10.873 18.0125C11.242 18.0487 11.618 18.0699 12 18.0699C16.97 18.0699 21 14.9203 21 11.0349C21 7.81088 16.97 4 12 4Z"
        fill="black"
      />
    </Svg>
  );
}
