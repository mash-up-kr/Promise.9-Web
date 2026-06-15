# 테스트 컨벤션 (Unit · Integration)

> TDD 로 개발한다 — **코드보다 테스트를 먼저 쓴다**(red → green → refactor). 행동 규칙은 core-rules.md.
> E2E 는 별도 담당(Maestro). 이 문서는 **unit · integration** 만 다룬다.

## 스택
- 러너: **jest-expo 56** (Expo 공식 프리셋, RN/expo 모듈 트랜스폼 처리).
- 컴포넌트: **@testing-library/react-native 14 (RNTL)**.
- React 19 대응: `react-test-renderer`(deprecated) 대신 `test-renderer` 사용.
- 실행: `pnpm test` (1회) · `pnpm test:watch` (TDD 루프).

## ⚠️ RNTL 14 핵심 — `render` 는 async
RNTL 14 부터 `render` / `rerender` / `unmount` 가 **Promise 를 반환**한다. 반드시 `await`.
```tsx
test('...', async () => {
  await render(<MyComponent />);   // ← await 필수 (빠뜨리면 screen 이 비어 실패)
  expect(screen.getByText('저장')).toBeOnTheScreen();
});
```
- 매처(`toBeOnTheScreen` 등)는 `@testing-library/react-native` 에서 무엇이든 import 하면 **자동 적용** — 별도 setup import 불필요.
- 사용자 상호작용은 `const user = userEvent.setup()` 후 `await user.press(...)`.

## 무엇을 테스트하나 (Zone 별)
구조는 structure.md 의 3-Zone 을 따른다.

| 대상 | 종류 | 무엇을 |
|------|------|--------|
| `shared/` (분류·검색·URL 정규화·API 변환) | **unit** | 순수 함수 입출력. 표면 무관 핵심 로직 → **1순위 테스트 대상** |
| `src/features/*` 컴포넌트 | **integration** | 사용자 관점 렌더·상호작용 (구현 디테일 X) |
| `src/features/*/api` react-query 훅 | **integration** | QueryClientProvider 래핑 + 네트워크 mock |
| `src/utils` 순수 함수 | unit | 입출력 |

**테스트하지 않는 것:** 서드파티 라이브러리 동작, 단순 패스스루, 스타일(className) 그 자체, 타입만으로 보장되는 것.

## 파일 위치 · 네이밍
- **소스 옆에 co-locate**. `LinkCard.tsx` → `LinkCard.test.tsx`, `normalizeUrl.ts` → `normalizeUrl.test.ts`.
- 테스트 파일도 import 는 절대경로(`@/`, `@shared/`) 규칙 동일.

## 쿼리 우선순위 (RNTL)
접근성·사용자 관점 우선. 위에서부터 시도:
1. `getByRole` (role + name)
2. `getByLabelText` / `getByText` / `getByPlaceholderText`
3. `getByTestId` — **최후의 수단** (위로 못 잡을 때만). testId 남발 금지.

## react-query 훅 통합 테스트 패턴
테스트 전용 QueryClient 를 만들어 `retry: false` 로 (실패 즉시 단언):
```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

test('링크 목록을 불러온다', async () => {
  const { result } = renderHook(() => useLinks(), { wrapper: createWrapper() });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toHaveLength(2);
});
```
- 네트워크(`shared/api` 의 fetch)는 mock 한다. 실제 백엔드 호출 금지.

## TDD 절차 (요약)
1. **red** — 원하는 동작을 기술하는 테스트를 먼저 쓴다. 실행 → 실패 확인.
2. **green** — 통과시킬 **최소** 코드만 작성.
3. **refactor** — 테스트 초록 유지하며 정리.

> 새 테스트는 `/new-test`, 새 코드 작성 전 `/check-dup`.
