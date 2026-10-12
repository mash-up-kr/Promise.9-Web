import { Component, type ReactNode } from "react";

export interface ErrorBoundaryFallbackProps {
  /** 던져진 값. 원인별로 분기하려면 `isUnauthorizedError()` 같은 가드로 좁힌다. */
  error: unknown;
  /** 에러 상태를 해제하고 children 을 다시 렌더한다(재시도 버튼용). */
  reset: () => void;
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  /**
   * 에러 시 렌더할 내용.
   *
   * 재시도가 필요 없으면 엘리먼트를 그대로 주고, 필요하면 함수로 받아 `reset` 을 쓴다.
   */
  fallback: ReactNode | ((props: ErrorBoundaryFallbackProps) => ReactNode);
  /** 값이 바뀌면 에러 상태를 해제하고 children 을 다시 렌더한다(예: URL 변경 시 재시도). */
  resetKeys?: readonly unknown[];
  /** 에러 상태가 해제될 때 호출한다(쿼리 에러 초기화 등). */
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: unknown;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: undefined };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidUpdate(prev: ErrorBoundaryProps) {
    if (
      this.state.hasError &&
      !areKeysEqual(prev.resetKeys, this.props.resetKeys)
    ) {
      this.reset();
    }
  }

  private reset = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onReset?.();
  };

  render() {
    const { fallback, children } = this.props;

    if (!this.state.hasError) {
      return children;
    }

    return typeof fallback === "function"
      ? fallback({ error: this.state.error, reset: this.reset })
      : fallback;
  }
}

function areKeysEqual(
  a: readonly unknown[] = [],
  b: readonly unknown[] = [],
): boolean {
  return a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
}
