import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
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
const ROOT_OUTLET_ID = "root";

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

interface SnackbarOutletContextValue {
  current: ActiveSnackbar | null;
  /** 등장 애니메이션을 마친 스낵바 — 다른 자리로 옮겨 그릴 때 다시 튀어나오지 않게. */
  enteredId: number | null;
  activeOutletId: string;
  registerOutlet: (outletId: string) => () => void;
  onEntered: (id: number) => void;
  hide: () => void;
}

const SnackbarOutletContext = createContext<SnackbarOutletContextValue | null>(
  null,
);

function useSnackbarOutletContext(): SnackbarOutletContextValue {
  const ctx = useContext(SnackbarOutletContext);
  if (!ctx) {
    throw new Error(
      "SnackbarOutlet 은 <SnackbarProvider> 안에서만 쓸 수 있습니다.",
    );
  }
  return ctx;
}

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const idRef = useRef(0);
  const [current, setCurrent] = useState<ActiveSnackbar | null>(null);
  const [enteredId, setEnteredId] = useState<number | null>(null);
  // 루트 위에 뜬 화면들의 자리 — 가장 나중에 열린(맨 위) 화면의 자리가 그리고, 없으면 루트가 그린다.
  const [outletIds, setOutletIds] = useState<string[]>([]);

  const hide = useCallback(() => setCurrent(null), []);

  // 한 번에 하나만 — 새 show 는 이전 것을 대체한다.
  const show = useCallback((options: SnackbarOptions) => {
    idRef.current += 1;
    setCurrent({ ...options, id: idRef.current });
  }, []);

  const registerOutlet = useCallback((outletId: string) => {
    setOutletIds((ids) => [...ids, outletId]);
    return () => setOutletIds((ids) => ids.filter((id) => id !== outletId));
  }, []);

  const value = useMemo(() => ({ show, hide }), [show, hide]);
  const outletValue = useMemo(
    () => ({
      current,
      enteredId,
      activeOutletId: outletIds[outletIds.length - 1] ?? ROOT_OUTLET_ID,
      registerOutlet,
      onEntered: setEnteredId,
      hide,
    }),
    [current, enteredId, outletIds, registerOutlet, hide],
  );

  return (
    <SnackbarContext.Provider value={value}>
      <SnackbarOutletContext.Provider value={outletValue}>
        {children}
        <SnackbarSlot outletId={ROOT_OUTLET_ID} />
      </SnackbarOutletContext.Provider>
    </SnackbarContext.Provider>
  );
}

/**
 * 루트 위에 따로 뜨는 화면(투명 모달 라우트 — iOS 는 네이티브 모달)이 열린 동안의 스낵바 자리.
 * 루트에 그린 스낵바는 그 화면 아래에 깔리므로, 그 화면 안에 두면 스낵바가 시트 위에 보인다.
 */
export function SnackbarOutlet() {
  const outletId = useId();
  const { registerOutlet } = useSnackbarOutletContext();

  useLayoutEffect(() => registerOutlet(outletId), [registerOutlet, outletId]);

  return <SnackbarSlot outletId={outletId} />;
}

function SnackbarSlot({ outletId }: { outletId: string }) {
  const { current, enteredId, activeOutletId, onEntered, hide } =
    useSnackbarOutletContext();
  const insets = useSafeAreaInsets();

  if (!current || activeOutletId !== outletId) return null;
  return (
    <SnackbarHost
      key={current.id}
      options={current}
      insetBottom={insets.bottom}
      shouldAnimateIn={current.id !== enteredId}
      onEntered={onEntered}
      onDismiss={hide}
    />
  );
}

// key(id) 로 show 마다 remount → useTimeout 이 매번 새로 시작하고,
// 언마운트(교체·hide) 시 대기 중인 자동 dismiss 타이머를 스스로 정리한다.
function SnackbarHost({
  options,
  insetBottom,
  shouldAnimateIn,
  onEntered,
  onDismiss,
}: {
  options: ActiveSnackbar;
  insetBottom: number;
  shouldAnimateIn: boolean;
  onEntered: (id: number) => void;
  onDismiss: () => void;
}) {
  useTimeout(onDismiss, options.duration ?? DEFAULT_DURATION);

  useEffect(() => onEntered(options.id), [onEntered, options.id]);

  return (
    <Animated.View
      // Figma: enter y 80→0·opacity 0→1 / exit y 0→40·opacity 1→0, spring(stiffness 420, damping 38).
      // exit 하강 거리는 FadeOutDown 기본값을 따름 — 정확히 40px 로 맞추려면 Keyframe 커스텀 필요, 육안 확인 후 조정.
      entering={
        shouldAnimateIn
          ? FadeInDown.springify()
              .damping(38)
              .stiffness(420)
              .withInitialValues({
                transform: [{ translateY: 80 }],
                opacity: 0,
              })
          : undefined
      }
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
