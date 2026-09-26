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

import { isIOS } from "@/constants/platform.constants";

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
  // show 마다 증가 — 같은 내용을 다시 띄워도 새 스낵바로 본다(등장 애니메이션·자동 dismiss).
  id: number;
  /** 띄울 때 열려 있던 자리들(아래 → 위). */
  outletIds: string[];
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
  // 루트 위에 뜬 화면들의 자리(아래 → 위). show 가 띄우는 순간의 목록을 읽도록 ref 에도 둔다.
  const [outletIds, setOutletIds] = useState<string[]>([]);
  const outletIdsRef = useRef<string[]>([]);

  const hide = useCallback(() => setCurrent(null), []);

  // 한 번에 하나만 — 새 show 는 이전 것을 대체한다.
  const show = useCallback((options: SnackbarOptions) => {
    idRef.current += 1;
    setCurrent({
      ...options,
      id: idRef.current,
      outletIds: outletIdsRef.current,
    });
  }, []);

  // 그리는 자리와 따로 잰다 — 시트가 닫혀 아래 화면으로 옮겨 그려도 처음부터 다시 재지 않는다.
  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(hide, current.duration ?? DEFAULT_DURATION);
    return () => clearTimeout(timer);
  }, [current, hide]);

  const registerOutlet = useCallback((outletId: string) => {
    outletIdsRef.current = [...outletIdsRef.current, outletId];
    setOutletIds(outletIdsRef.current);
    return () => {
      outletIdsRef.current = outletIdsRef.current.filter(
        (id) => id !== outletId,
      );
      setOutletIds(outletIdsRef.current);
    };
  }, []);

  const value = useMemo(() => ({ show, hide }), [show, hide]);
  const outletValue = useMemo(
    () => ({
      current,
      enteredId,
      activeOutletId: findActiveOutletId(current, outletIds),
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

// 띄울 때 열려 있던 자리 중 아직 열린 맨 위 자리에 그린다. 나중에 열린 시트로 옮기면 원래 자리의 퇴장
// 애니메이션이 dim 아래로 비치고 시트에는 애니메이션 없이 새로 뜬다.
function findActiveOutletId(
  snackbar: ActiveSnackbar | null,
  openOutletIds: string[],
): string {
  const outletIds = (snackbar?.outletIds ?? []).filter((id) =>
    openOutletIds.includes(id),
  );
  return outletIds[outletIds.length - 1] ?? ROOT_OUTLET_ID;
}

/**
 * 투명 모달 라우트가 열린 동안의 스낵바 자리. iOS 는 그 라우트를 네이티브 모달로 띄워 루트에 그린 스낵바가
 * 그 아래에 깔린다 — 라우트 안에 두면 시트 위에 보인다. Android·웹은 루트 스낵바가 그대로 위에 보여 쓰지 않는다.
 */
export function SnackbarOutlet() {
  return isIOS ? <ModalSnackbarOutlet /> : null;
}

function ModalSnackbarOutlet() {
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
