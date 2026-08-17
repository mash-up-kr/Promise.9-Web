import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTimeout } from "react-simplikit";

import { Snackbar, type SnackbarAction } from "./Snackbar";

export interface SnackbarOptions {
  message: string;
  icon?: ReactNode;
  action?: SnackbarAction;
  // 자동 dismiss 까지 ms. 기본 2500.
  duration?: number;
}

interface SnackbarContextValue {
  show: (options: SnackbarOptions) => void;
  hide: () => void;
}

const DEFAULT_DURATION = 2500;

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

export function useSnackbar(): SnackbarContextValue {
  const ctx = useContext(SnackbarContext);
  if (!ctx) {
    throw new Error(
      "useSnackbar 는 <SnackbarProvider> 안에서만 쓸 수 있습니다.",
    );
  }
  return ctx;
}

interface ActiveSnackbar extends SnackbarOptions {
  // show 마다 증가 — 호스트를 remount 시켜 자동 dismiss 타이머를 재시작한다.
  id: number;
}

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const idRef = useRef(0);
  const [current, setCurrent] = useState<ActiveSnackbar | null>(null);

  const hide = useCallback(() => setCurrent(null), []);

  // 한 번에 하나만 — 새 show 는 이전 것을 대체한다.
  const show = useCallback((options: SnackbarOptions) => {
    idRef.current += 1;
    setCurrent({ ...options, id: idRef.current });
  }, []);

  const value = useMemo(() => ({ show, hide }), [show, hide]);

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      {current ? (
        <SnackbarHost
          key={current.id}
          options={current}
          insetBottom={insets.bottom}
          onDismiss={hide}
        />
      ) : null}
    </SnackbarContext.Provider>
  );
}

// key(id) 로 show 마다 remount → useTimeout 이 매번 새로 시작하고,
// 언마운트(교체·hide) 시 대기 중인 자동 dismiss 타이머를 스스로 정리한다.
function SnackbarHost({
  options,
  insetBottom,
  onDismiss,
}: {
  options: SnackbarOptions;
  insetBottom: number;
  onDismiss: () => void;
}) {
  useTimeout(onDismiss, options.duration ?? DEFAULT_DURATION);

  return (
    <Animated.View
      // Figma: enter y 80→0·opacity 0→1 / exit y 0→40·opacity 1→0, spring(stiffness 420, damping 38).
      // exit 하강 거리는 FadeOutDown 기본값을 따름 — 정확히 40px 로 맞추려면 Keyframe 커스텀 필요, 육안 확인 후 조정.
      entering={FadeInDown.springify()
        .damping(38)
        .stiffness(420)
        .withInitialValues({ transform: [{ translateY: 80 }], opacity: 0 })}
      exiting={FadeOutDown.springify().damping(38).stiffness(420)}
      pointerEvents="box-none"
      className="absolute inset-x-0 px-4"
      style={{ bottom: insetBottom + 16 }}
    >
      <Snackbar
        message={options.message}
        icon={options.icon}
        action={
          options.action
            ? {
                label: options.action.label,
                onPress: () => {
                  options.action?.onPress();
                  onDismiss();
                },
              }
            : undefined
        }
      />
    </Animated.View>
  );
}
