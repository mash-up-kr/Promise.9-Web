import type { ReactElement } from "react";

type StringifiedValue<T> =
  | (T extends boolean ? "true" | "false" : never)
  | (T extends number ? `${T}` : never)
  | (T extends string ? T : never);

export interface SwitchCaseProps<Case> {
  value: Case;
  caseBy: Partial<{
    [P in StringifiedValue<Case>]: () => ReactElement | null;
  }>;
  defaultComponent?: () => ReactElement | null;
}

/**
 * 주어진 `value` 에 일치하는 컴포넌트를 선언적으로 렌더한다. switch-case 의 JSX 버전.
 *
 * `caseBy` 의 키는 `value` 를 문자열로 변환한 값과 매칭된다. 일치하는 키가 없으면 `defaultComponent` 를,
 * 그것도 없으면 `null` 을 반환한다.
 *
 * @example
 * <SwitchCase
 *   value={status}
 *   caseBy={{
 *     loading: () => <Spinner />,
 *     error: () => <ErrorView />,
 *     success: () => <Content />,
 *   }}
 *   defaultComponent={() => <Empty />}
 * />
 */
export function SwitchCase<Case>({
  value,
  caseBy,
  defaultComponent = () => null,
}: SwitchCaseProps<Case>): ReactElement | null {
  const key = String(value) as StringifiedValue<Case>;
  return (caseBy[key] ?? defaultComponent)();
}
