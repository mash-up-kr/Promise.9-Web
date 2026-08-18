import { useEffect, useRef, useState } from "react";

export interface UseDelayedLoadingOptions {
  /** 이 시간 미만에 끝나면 로딩 표시를 생략한다(짧은 응답에서의 깜빡임 방지). */
  delayMs?: number;
  /** 한 번 표시되면 최소 이 시간은 유지한다(너무 빨리 사라지는 깜빡임 방지). */
  minDurationMs?: number;
}

const DEFAULT_DELAY_MS = 200;
const DEFAULT_MIN_DURATION_MS = 300;

/**
 * Figma Spinner 주석의 로딩 정책 — "응답 200ms 미만이면 스피너 생략, 200ms 이상이면
 * 표시하되 최소 300ms 유지 후 전환" — 을 구현한다.
 *
 * 원본 `isLoading` 을 스피너에 그대로 연결하면 짧은 응답에서도 반짝이므로, 실제 로딩
 * 상태와 "화면에 보여줄" 상태를 분리한다. 스피너 자체(모양·사이즈·톤)는 이미 공용
 * `Spinner` 컴포넌트가 시안대로 구현하고 있어, 이 훅은 그 컴포넌트를 감싸 쓰는
 * 호출부(예: SocialLoginButton)의 표시 타이밍만 책임진다.
 */
export function useDelayedLoading(
  isLoading: boolean,
  {
    delayMs = DEFAULT_DELAY_MS,
    minDurationMs = DEFAULT_MIN_DURATION_MS,
  }: UseDelayedLoadingOptions = {},
): boolean {
  const [shown, setShown] = useState(false);
  // 렌더와 무관하게 "실제로 보여주기 시작한 시각"을 들고 있어야 최소 유지시간을 계산할 수 있다.
  const shownAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (isLoading) {
      const delayTimer = setTimeout(() => {
        shownAtRef.current = Date.now();
        setShown(true);
      }, delayMs);
      return () => clearTimeout(delayTimer);
    }

    if (shownAtRef.current === null) {
      // delayMs 이전에 끝났다 — 한 번도 보여준 적이 없으니 할 일이 없다.
      return;
    }

    const elapsed = Date.now() - shownAtRef.current;
    const remaining = Math.max(0, minDurationMs - elapsed);
    const hideTimer = setTimeout(() => {
      setShown(false);
      shownAtRef.current = null;
    }, remaining);
    return () => clearTimeout(hideTimer);
  }, [isLoading, delayMs, minDurationMs]);

  return shown;
}
