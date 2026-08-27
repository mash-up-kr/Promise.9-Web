import { useEffect, useRef } from "react";

/**
 * 패널 어디에 포커스가 있든 Enter 로 주 동작을 실행한다(시안 공통 'Enter' 안내).
 *
 * 메모 입력 중에는 줄바꿈이 우선이라 textarea 안에서는 동작하지 않는다.
 */
export function useEnterShortcut(
  onEnter: (() => void) | undefined,
  enabled = true,
): void {
  // 콜백이 매 렌더 새로 만들어져도 리스너를 다시 붙이지 않도록 ref 로 최신 값만 따라간다.
  const handlerRef = useRef(onEnter);
  handlerRef.current = onEnter;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || event.isComposing) return;
      if (event.target instanceof HTMLTextAreaElement) return;

      event.preventDefault();
      handlerRef.current?.();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled]);
}
