import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { Component, type ErrorInfo, type ReactNode, Suspense } from "react";

interface ErrorBoundaryProps {
  onReset: () => void;
  fallback: (retry: () => void) => ReactNode;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// React 19 에도 함수형 에러 경계는 없다 — 클래스가 유일한 방법이다.
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // 패널은 devtools 를 따로 열어야 보여서, 최소한 콘솔에는 남긴다.
    console.error("[popup]", error, info.componentStack);
  }

  private readonly retry = () => {
    this.props.onReset();
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    if (this.state.hasError) return this.props.fallback(this.retry);

    return this.props.children;
  }
}

export interface AsyncBoundaryProps {
  pending: ReactNode;
  /** 실패 화면. 인자로 받은 함수를 부르면 쿼리를 초기화하고 다시 시도한다. */
  rejected: (retry: () => void) => ReactNode;
  children: ReactNode;
}

/**
 * 로딩·에러 분기를 화면 본문에 나열하지 않기 위한 경계(앱의 AsyncBoundary 와 같은 역할).
 *
 * 이 화면에서 특히 중요한 이유: 폴더 조회가 실패해도 저장 화면 자체는 살아 있어야
 * 미분류로라도 저장할 수 있다.
 */
export function AsyncBoundary({
  pending,
  rejected,
  children,
}: AsyncBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary onReset={reset} fallback={rejected}>
          <Suspense fallback={pending}>{children}</Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
