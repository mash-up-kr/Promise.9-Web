import type { TrackOptions } from "@shared/analytics/analytics.events";
import { type ComponentType, type Ref, useCallback } from "react";
import type { View } from "react-native";
import { useTrackClick } from "@/hooks/useTrackClick";
import { useTrackImpression } from "@/hooks/useTrackImpression";

interface TrackingTargetProps {
  ref?: Ref<View>;
  disabled?: boolean | null;
  onPress?: ((...args: never[]) => void) | null;
}
export interface TrackingProps {
  tracking?: TrackOptions & { label: string };
}

// 기존 mergeRefs는 React 19 callback ref의 cleanup 반환값을 전달하지 않는다.
function attachRef(ref: Ref<View> | undefined, node: View | null): () => void {
  if (typeof ref === "function") {
    const cleanup = ref(node);
    return () => {
      if (typeof cleanup === "function") cleanup();
      else ref(null);
    };
  }
  if (ref) ref.current = node;
  return () => {
    if (ref) ref.current = null;
  };
}

/** onPress와 측정 가능한 ref를 전달하는 컴포넌트를 모듈 최상위에서 감싼다. */
export function withTracking<Props extends TrackingTargetProps>(
  Component: ComponentType<Props>,
) {
  function TrackedComponent({ tracking, ...props }: Props & TrackingProps) {
    const label = tracking?.label?.trim() ?? "";
    const options = {
      ...tracking,
      disabled: Boolean(!label || tracking?.disabled || props.disabled),
    };
    const trackClick = useTrackClick(label, options);
    const impressionRef = useTrackImpression(label, options);
    const originalRef = props.ref;
    const ref = useCallback(
      (node: View | null) => {
        const cleanImpression = attachRef(impressionRef, node);
        const cleanOriginal = attachRef(originalRef, node);
        return () => {
          cleanImpression();
          cleanOriginal();
        };
      },
      [impressionRef, originalRef],
    );
    const originalPress = props.onPress;
    const onPress = useCallback(
      (...args: Parameters<NonNullable<Props["onPress"]>>) => {
        trackClick();
        return originalPress?.(...args);
      },
      [trackClick, originalPress],
    );
    // HOC가 추가한 tracking만 제거하고 원래 props·콜백 인자 타입을 유지한다.
    return (
      <Component {...(props as unknown as Props)} ref={ref} onPress={onPress} />
    );
  }
  TrackedComponent.displayName = `withTracking(${Component.displayName ?? Component.name ?? "Component"})`;
  return TrackedComponent;
}
