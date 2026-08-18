import type { ComponentType } from "react";
import type { SvgProps } from "react-native-svg";

import type { SocialProvider } from "../../auth.constants";
import { AppleIcon } from "./AppleIcon";
import { GoogleIcon } from "./GoogleIcon";
import { KakaoIcon } from "./KakaoIcon";

// provider → 브랜드 아이콘 컴포넌트. Record 라 provider 추가 시 아이콘 누락을 컴파일에서 잡는다.
export const SOCIAL_ICON: Record<SocialProvider, ComponentType<SvgProps>> = {
  kakao: KakaoIcon,
  google: GoogleIcon,
  apple: AppleIcon,
};

export { AppleIcon, GoogleIcon, KakaoIcon };
