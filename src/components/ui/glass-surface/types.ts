import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";

export interface GlassSurfaceProps {
  children?: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  /** 모서리 반경(px). 기본 9999 = 캡슐/원형. */
  cornerRadius?: number;
  /** 유리 틴트 색(hex). 플랫폼별 prop 으로 매핑된다. */
  tint?: string;
}
