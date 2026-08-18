import { useId } from "react";
import Svg, {
  Defs,
  G,
  LinearGradient,
  Path,
  Stop,
  type SvgProps,
} from "react-native-svg";

export interface LoginSpotlightProps extends SvgProps {
  size?: number;
}

// Figma "Vector 863" — 캐릭터 뒤에서 아래로 퍼지는 빛. 위(노랑)→아래(투명) 그라디언트, 전체 opacity 0.2.
export function LoginSpotlight({ size = 285, ...props }: LoginSpotlightProps) {
  // 웹(RN Web)에서 gradient id 는 실제 DOM id 라 인스턴스마다 고유해야 한다. 콜론은 SVG id 에서 빼둔다.
  const gradientId = `loginSpotlight-${useId().replace(/:/g, "")}`;
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 305.009 304.929"
      fill="none"
      {...props}
    >
      <Defs>
        <LinearGradient
          id={gradientId}
          x1="152.196"
          y1="1.92866"
          x2="152.196"
          y2="286.929"
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#FFFF63" />
          <Stop offset="1" stopColor="#FFFF63" stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <G opacity={0.2}>
        <Path
          d="M273.97 286.929H31.0414C21.303 286.929 15.0222 276.616 19.4909 267.963L144.954 25.0347C149.87 15.5156 163.544 15.6957 168.208 25.3409L285.674 268.27C289.848 276.902 283.559 286.929 273.97 286.929Z"
          fill={`url(#${gradientId})`}
          fillOpacity={0.8}
        />
        <Path
          d="M136.958 20.9052C145.277 4.79613 168.417 5.10046 176.31 21.4228L293.776 264.352C300.84 278.96 290.197 295.928 273.97 295.929H31.0417C14.5614 295.929 3.9324 278.476 11.4949 263.833L136.958 20.9052Z"
          stroke={`url(#${gradientId})`}
          strokeOpacity={0.4}
          strokeWidth={18}
        />
      </G>
    </Svg>
  );
}
