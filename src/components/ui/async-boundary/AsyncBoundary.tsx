import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { type ReactNode, Suspense } from "react";

import {
  ErrorBoundary,
  type ErrorBoundaryFallbackProps,
} from "@/components/ui/error-boundary/ErrorBoundary";

export interface AsyncBoundaryProps {
  children: ReactNode;
  /** suspend 중에 렌더할 내용(스켈레톤 등). */
  pending: ReactNode;
  /** 에러 시 렌더할 내용. 재시도가 필요하면 함수로 받아 `reset` 을 쓴다. */
  fallback: ReactNode | ((props: ErrorBoundaryFallbackProps) => ReactNode);
  /** 값이 바뀌면 에러 상태를 해제한다(예: 조회 파라미터 변경 시 자동 재시도). */
  resetKeys?: readonly unknown[];
}

/**
 * 비동기 자식의 로딩·에러를 선언적으로 처리하는 경계.
 *
 * `useSuspenseQuery` 와 짝이다 — 자식은 성공 케이스만 다루면 되고, `data` 가 nullable 이
 * 아니라 `?? []` 같은 폴백이 사라진다.
 *
 * 세 겹인 이유: ErrorBoundary 만으로 재시도하면 쿼리 캐시에 에러가 남아 자식이 곧바로 다시
 * 던진다. QueryErrorResetBoundary 의 `reset` 을 함께 호출해야 다음 렌더에서 재요청이 나간다.
 */
export function AsyncBoundary({
  children,
  pending,
  fallback,
  resetKeys,
}: AsyncBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          fallback={fallback}
          resetKeys={resetKeys}
          onReset={reset}
        >
          <Suspense fallback={pending}>{children}</Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
