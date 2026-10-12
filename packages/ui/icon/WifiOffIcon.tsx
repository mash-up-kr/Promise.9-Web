import Svg, { Path } from "react-native-svg";

// Figma Snackbar/Offline 아이콘 원본 stroke(#FF6666) — 디자인 시스템에 아직 미토큰화.
// 선 기반(stroke) 아이콘이라 다른 3종(solid fill)과 구조가 다르다.
const WIFI_OFF_COLOR = "#FF6666";

export interface WifiOffIconProps {
  size?: number;
}

export function WifiOffIcon({ size = 20 }: WifiOffIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M4.16667 10.4582C5.8138 9.08625 7.88967 8.33496 10.0333 8.33496C12.177 8.33496 14.2529 9.08625 15.9 10.4582"
        stroke={WIFI_OFF_COLOR}
        strokeWidth={1.66667}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M1.18333 7.49983C3.61868 5.35313 6.75358 4.1687 10 4.1687C10.2948 4.1687 10.5886 4.17847 10.8811 4.19783"
        stroke={WIFI_OFF_COLOR}
        strokeWidth={1.66667}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7.10833 13.4252C7.95433 12.8241 8.96639 12.5012 10.0042 12.5012C11.0419 12.5012 12.054 12.8241 12.9 13.4252"
        stroke={WIFI_OFF_COLOR}
        strokeWidth={1.66667}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10 16.6667H10.0083"
        stroke={WIFI_OFF_COLOR}
        strokeWidth={1.66667}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M17.5 3.33333L14.1667 6.66667"
        stroke={WIFI_OFF_COLOR}
        strokeWidth={1.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14.1667 3.33333L17.5 6.66667"
        stroke={WIFI_OFF_COLOR}
        strokeWidth={1.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10 16.5H10.0143"
        stroke={WIFI_OFF_COLOR}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
