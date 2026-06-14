---
name: new-test
description: jest-expo + RNTL 기반 테스트를 팀 컨벤션대로 스캐폴드한다. Use when writing a test, or starting the TDD red step before implementation. unit·integration 만 (E2E 제외).
---

# new-test — 테스트 작성 (TDD)

## 먼저
- TDD 다 — **구현보다 테스트를 먼저** 쓴다(절대 규칙 7). red → green → refactor.
- 규칙: docs/conventions/testing.md, structure.md.
- 새 코드 작성이면 `/check-dup` 을 먼저(이미 했으면 생략).

## 위치 · 네이밍
- **소스 옆에 co-locate.** `LinkCard.tsx` → `LinkCard.test.tsx`, `normalizeUrl.ts` → `normalizeUrl.test.ts`.
- import 는 절대경로(`@/`, `@shared/`).

## 어떤 템플릿? (대상으로 판단)
- `shared/` 또는 `src/utils` **순수 함수** → 단위 테스트
- `src/features/*` **컴포넌트** → 컴포넌트 통합 테스트
- `src/features/*/api` **react-query 훅** → 훅 통합 테스트

## ⚠️ RNTL 14 필수 규칙
- `render` / `rerender` / `unmount` 는 **async** → 반드시 `await render(...)`. (빠뜨리면 screen 이 비어 실패)
- 매처는 `@testing-library/react-native` 에서 import 만 하면 자동 적용.
- 쿼리 우선순위: `getByRole` → `getByText`/`getByLabelText` → `getByTestId`(최후).

## 템플릿

### 1) 순수 함수 (unit)
```ts
import { normalizeUrl } from '@shared/domain/normalizeUrl';

describe('normalizeUrl', () => {
  test('쿼리스트링 추적 파라미터를 제거한다', () => {
    expect(normalizeUrl('https://a.com/x?utm_source=y')).toBe('https://a.com/x');
  });
});
```

### 2) 컴포넌트 (integration)
```tsx
import { render, screen, userEvent } from '@testing-library/react-native';
import { LinkCard } from './LinkCard';

test('제목을 보여주고, 누르면 onPress 를 호출한다', async () => {
  const onPress = jest.fn();
  await render(<LinkCard title="제목" onPress={onPress} />);

  expect(screen.getByText('제목')).toBeOnTheScreen();

  const user = userEvent.setup();
  await user.press(screen.getByText('제목'));
  expect(onPress).toHaveBeenCalledTimes(1);
});
```

### 3) react-query 훅 (integration)
```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import { useLinks } from './useLinks';

function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

test('링크 목록을 불러온다', async () => {
  // shared/api 의 fetch 는 mock 한다 (실제 호출 금지)
  const { result } = renderHook(() => useLinks(), { wrapper: createWrapper() });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toHaveLength(2);
});
```

## 절차 (red → green)
1. 위 템플릿으로 **원하는 동작**을 단언하는 테스트를 쓴다.
2. `pnpm test` (또는 `pnpm test:watch`) → **실패(red) 확인**. 실패해야 정상.
3. 통과시키는 **최소** 구현을 한다 → 초록(green).
4. 초록 유지하며 정리(refactor).
