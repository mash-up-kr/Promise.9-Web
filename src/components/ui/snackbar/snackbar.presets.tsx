import { AlertCircleIcon } from "@/components/ui/icon/AlertCircleIcon";
import { CheckCircleIcon } from "@/components/ui/icon/CheckCircleIcon";
import { FrownIcon } from "@/components/ui/icon/FrownIcon";
import { WifiOffIcon } from "@/components/ui/icon/WifiOffIcon";

import type { SnackbarOptions } from "./SnackbarProvider";

// Figma Snackbar 4상태(성공·중복·실패·오프라인) 프리셋.
// Snackbar/SnackbarProvider 는 상태를 모르는 조합형 프리미티브라, 반복되는 상태별
// 아이콘·문구·액션 조합을 여기서 한 곳에 고정해 일관성을 지킨다.
export const snackbarPresets = {
  success: (message: string): SnackbarOptions => ({
    message,
    icon: <CheckCircleIcon />,
  }),
  duplicate: (message: string, onView: () => void): SnackbarOptions => ({
    message,
    icon: <AlertCircleIcon />,
    action: { label: "보기", onPress: onView },
  }),
  failed: (message: string, onRetry: () => void): SnackbarOptions => ({
    message,
    icon: <FrownIcon />,
    action: { label: "다시 시도", onPress: onRetry },
  }),
  offline: (onRetry: () => void): SnackbarOptions => ({
    message: "오프라인 상태예요. 연결되면 저장할게요.",
    icon: <WifiOffIcon />,
    action: { label: "다시 시도", onPress: onRetry },
  }),
};
