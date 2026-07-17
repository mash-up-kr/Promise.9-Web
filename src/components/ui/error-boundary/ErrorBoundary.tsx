import { Component, type ReactNode } from "react";

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
  /** 값이 바뀌면 에러 상태를 해제하고 children 을 다시 렌더한다(예: URL 변경 시 재시도). */
  resetKeys?: readonly unknown[];
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidUpdate(prev: ErrorBoundaryProps) {
    if (
      this.state.hasError &&
      !areKeysEqual(prev.resetKeys, this.props.resetKeys)
    ) {
      this.setState({ hasError: false });
    }
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

function areKeysEqual(
  a: readonly unknown[] = [],
  b: readonly unknown[] = [],
): boolean {
  return a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
}
