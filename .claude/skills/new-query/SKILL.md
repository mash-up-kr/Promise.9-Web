---
name: new-query
description: TanStack Query 쿼리 정의·훅을 팀 컨벤션대로 스캐폴드한다. Use when connecting an API or creating useQuery/useMutation hooks (예:"API 연동해줘", "쿼리 훅 만들어줘", "서버 데이터 불러와줘"). 폼 상태(react-hook-form)·로컬 UI 상태(useState)·익스텐션 코드에는 사용하지 않는다.
---

# new-query — 서버 상태 (앱/웹)

## 먼저
- **`/check-dup` 를 먼저 수행**(이미 했으면 생략). 같은 도메인 쿼리가 있으면 그 파일에 추가한다.
- **TDD**: 훅을 만들기 전 `/new-test` 의 "react-query 훅 (integration)" 템플릿으로 실패 테스트부터 쓴다.

## 위치 / 네이밍
- 쿼리 정의 + mutation 훅: `src/features/<기능>/api/<도메인>.queries.ts`
- 쿼리 정의 객체는 `<도메인>Queries`, mutation 훅은 `useXxxMutation`.

## 규칙
1. **쿼리키는 계층적 팩토리**로만 만든다. 문자열 배열을 호출부에 직접 쓰지 않는다 — 무효화가 상위 키로 한 번에 되게.
2. **쿼리는 `queryOptions()` 헬퍼로 정의**하고 컴포넌트는 `useQuery(xxxQueries.detail(id))` 로 소비한다.
3. **queryFn/mutationFn 은 `@shared/api` 의 `apiClient`** 를 쓴다. 에러는 apiClient 가 이미 서브클래스(`ApiError` 등)로 던지므로 **try/catch 로 삼키지 말고 그대로 전파** — 컴포넌트에서 `error` 상태 + `isUnauthorizedError()` 같은 가드로 분기한다.
4. `queryFn` 에는 `{ signal }` 을 받아 요청에 전달한다 (언마운트 시 취소).
5. **훅 안에서는 `useQueryClient()`** 를 쓴다. `@/lib/queryClient` 전역 인스턴스를 직접 import 하면 테스트 wrapper(테스트별 새 QueryClient)와 어긋난다. 전역 인스턴스는 Provider 세팅·React 밖 코드 전용.

## 템플릿
```tsx
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@shared/api';

import type { CreateLinkPayload, Link, LinkFilter } from './types';

const linkKeys = {
  root: () => ['link'] as const,
  list: (filter: LinkFilter) => [...linkKeys.root(), 'list', filter] as const,
  detail: (id: string) => [...linkKeys.root(), 'detail', id] as const,
};

export const linkQueries = {
  keys: linkKeys,
  list: (filter: LinkFilter) =>
    queryOptions({
      queryKey: linkKeys.list(filter),
      queryFn: async ({ signal }) => {
        const { data } = await apiClient.get<Link[]>('/links', { params: filter, signal });
        return data;
      },
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: linkKeys.detail(id),
      queryFn: async ({ signal }) => {
        const { data } = await apiClient.get<Link>(`/links/${id}`, { signal });
        return data;
      },
    }),
};

export function useCreateLinkMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateLinkPayload) => {
      const { data } = await apiClient.post<Link>('/links', payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: linkKeys.root() }),
  });
}
```

## 더 필요할 때 (references/patterns.md)
낙관적 업데이트 + 롤백 · prefetch · infinite query · 캐시 직접 읽기/쓰기 는 [references/patterns.md](references/patterns.md) 를 보고 추가한다. 기본 템플릿에 미리 넣지 않는다.

작성 후 `pnpm test` 로 red → green 확인, `pnpm check` 로 lint 확인.
