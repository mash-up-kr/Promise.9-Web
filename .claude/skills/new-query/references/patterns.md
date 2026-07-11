# new-query — 선택 패턴

기본 템플릿(SKILL.md)으로 부족할 때만 꺼내 쓴다. 참고 원형: realworld-react-fsd `article.queries.ts`.

## 낙관적 업데이트 + 롤백

mutation 결과가 뻔하고(토글류) 즉각 반영이 UX 에 중요한 경우만. 서버 응답을 그대로 보여줘도 되면 `invalidateQueries` 로 충분하다.

```tsx
export function useFavoriteLinkMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post(`/links/${id}/favorite`),
    onMutate: async (id) => {
      const detailKey = linkKeys.detail(id);
      // 진행 중인 refetch 가 낙관적 값을 덮지 않게 취소
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<Link>(detailKey);
      if (previous) {
        queryClient.setQueryData<Link>(detailKey, { ...previous, isFavorited: true });
      }
      return { previous };
    },
    onError: (_error, id, context) => {
      // 실패 시 스냅샷으로 롤백
      if (context?.previous) {
        queryClient.setQueryData(linkKeys.detail(id), context.previous);
      }
    },
    onSettled: (_data, _error, id) =>
      queryClient.invalidateQueries({ queryKey: linkKeys.detail(id) }),
  });
}
```

## prefetch

화면 진입 전에 미리 당겨올 때. `queryOptions` 정의를 재사용한다.

```tsx
const queryClient = useQueryClient();
queryClient.prefetchQuery(linkQueries.detail(id));
```

## infinite query

`infiniteQueryOptions()` 로 정의하고 키는 팩토리에 분기를 추가한다.

```tsx
import { infiniteQueryOptions } from '@tanstack/react-query';

const linkKeys = {
  // ...기존 키
  infiniteList: (filter: LinkFilter) => [...linkKeys.root(), 'infinite', filter] as const,
};

export const linkQueries = {
  // ...기존 쿼리
  infiniteList: (filter: LinkFilter) =>
    infiniteQueryOptions({
      queryKey: linkKeys.infiniteList(filter),
      queryFn: async ({ pageParam, signal }) => {
        const { data } = await apiClient.get<PaginatedResponse<Link>>('/links', {
          params: { ...filter, cursor: pageParam },
          signal,
        });
        return data;
      },
      initialPageParam: null as string | null,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }),
};
```

## 캐시 직접 읽기/쓰기

목록 캐시를 상세의 `initialData` 로 재활용하는 등. 훅/컴포넌트 안에서는 반드시 `useQueryClient()` 로 얻은 인스턴스를 쓴다.

```tsx
detail: (id: string, queryClient: QueryClient) =>
  queryOptions({
    queryKey: linkKeys.detail(id),
    queryFn: /* ... */,
    initialData: () =>
      queryClient
        .getQueryData<Link[]>(linkKeys.list({}))
        ?.find((link) => link.id === id),
  }),
```
