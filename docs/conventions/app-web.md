# 앱 · 웹 컨벤션 (Expo 56 / RN / RN Web)

> 코드 작성 전 https://docs.expo.dev/versions/v56.0.0/ 확인. 공통 규칙은 shared.md.

## 스택
- Expo 56, React Native 0.85, React 19.2.
- expo-router (파일기반 라우팅, typed routes ON, reactCompiler ON).
- 데이터: `@tanstack/react-query`. 스타일: NativeWind(`className`).

## 라우팅 (expo-router)
- `src/app/` 는 **라우팅 껍데기만**. 화면 로직은 `src/features/<기능>/` 에 두고 import.
- 공통 provider(QueryClientProvider 등)는 루트 `app/_layout.tsx` 에.
- typed routes 사용 — 링크/네비게이션은 타입 안전하게.

## 스타일 (NativeWind)
- `className` 으로 스타일링. 색상/간격 등 토큰은 `src/global.css` 의 `@theme` 블록에 정의해 재사용 (Tailwind v4).
- 플랫폼 분기: className 우선 → 불가피하면 `Platform.select` 또는 `*.web.tsx` / `*.native.tsx` 파일 분리.
- 웹 전용/네이티브 전용 API 는 플랫폼 가드 필수.

## 데이터 (TanStack Query)
- 서버 상태는 react-query 로만. 로컬 UI 상태와 섞지 않는다.
- queryKey 는 배열 + 도메인 우선: `['link', 'list', params]`, `['link', 'detail', id]`.
- react-query 훅은 해당 기능의 `src/features/<기능>/api/` 에 둔다.
- 백엔드 호출(fetch + 타입)은 `shared/api/` 클라이언트를 재사용 (앱·익스텐션 공통, 중복 금지).
- queryClient 설정은 `@/lib/queryClient` (이미 존재).

## 로딩 · 에러

서버 조회의 로딩·에러는 **경계(`AsyncBoundary`) 또는 지역 상태(`useQuery`) 둘 중 하나**로 다룬다.
어느 쪽이 맞는지는 **UI 가 실패·로딩 때 무엇을 보여줘야 하는가**로 정한다. 기본값을 정해두고 밀어붙이지 말고, 아래 기준으로 한 번 판단한 뒤 고른다.

### 경계(AsyncBoundary)가 맞는 경우
- 데이터가 없으면 그 영역이 **성립하지 않을 때** (목록·상세 본문). 로딩은 스켈레톤 한 덩어리, 실패는 그 영역 전체를 재시도 UI 로 교체해도 되는 경우.
- 자식 코드가 `data ?? []` · `data?.foo` 같은 **nullable 폴백으로 지저분해질 때**. `useSuspenseQuery` 로 넘기면 자식은 성공 케이스만 다룬다.
- 같은 화면의 **여러 조회를 하나의 로딩·에러 상태로 묶고 싶을 때**.

### 지역 상태(`useQuery` + `isPending` / `isError`)가 맞는 경우
- **이미 보이는 UI 를 유지한 채** 갱신해야 할 때 (필터·검색어 변경 시 이전 결과 유지, 백그라운드 refetch). 경계로 올리면 화면이 스켈레톤으로 깜빡인다.
- 실패를 **인라인으로만** 알려야 할 때 (한 섹션 실패가 나머지 정보를 지우면 안 되는 화면).
- **조건부 조회** — `enabled` 로 끄고 켜야 하는 쿼리. `useSuspenseQuery` 는 끌 수 없다.
- **mutation** — `useMutation` 의 `isPending`·에러는 항상 지역 상태다(버튼 disabled, 토스트). 경계로 올리지 않는다.
- 조회 **이전** 단계의 검증(잘못된 라우트 파라미터 등)은 경계 밖에서 막는다. 예: `ArchiveDetailScreen`.

### 경계를 쓰기로 했다면
직접 `Suspense` + `ErrorBoundary` 를 조합하지 말고 `@/components/ui/async-boundary/AsyncBoundary` 를 쓴다
(재시도 시 쿼리 캐시의 에러까지 리셋하는 조합이 이미 들어 있다).

- 자식은 `useSuspenseQuery(xxxQueries.yyy())` 로 조회한다.
- `pending` 은 스켈레톤, `fallback` 은 재시도가 필요하면 **함수로 받아** `reset` 을 버튼에 연결한다.
- 실패 원인별로 다른 UI 가 필요하면 `fallback` 함수의 `error` 를 쓴다. `unknown` 이므로 `isUnauthorizedError()` 같은 가드로 좁혀서 분기한다.
- 조회 파라미터가 바뀔 때 에러가 자동 해제되도록 `resetKeys={[id]}` 를 준다.
- 경계는 화면 전체가 아니라 **실제로 서스펜드하는 조각**만 감싼다. 헤더처럼 항상 보여야 하는 UI 는 경계 밖에 둔다(예: `ArchiveScreen`).
- **한 컴포넌트에서 `useSuspenseQuery` 를 여러 번 호출하면 순차 실행(워터폴)** 이다. 여러 조회를 한 경계로 묶더라도 병렬로 나가야 하면 `useSuspenseQueries` 를 쓰거나 조회별 자식 컴포넌트로 쪼갠다.

```tsx
<AsyncBoundary
  resetKeys={[folderId]}
  pending={<FolderListSkeleton />}
  fallback={({ reset }) => (
    <CenteredMessage>
      <Text variant="body-2-normal" className="text-text-alternative">
        링크를 불러오지 못했어요.
      </Text>
      <Pressable accessibilityRole="button" onPress={reset}>
        <Text variant="label-1" className="text-icon-accent">
          다시 시도
        </Text>
      </Pressable>
    </CenteredMessage>
  )}
>
  <FolderLinks folderId={folderId} />
</AsyncBoundary>
```

재시도 UI 는 아직 공용 컴포넌트가 없어 화면마다 인라인이다(`ArchiveScreen` · `ArchiveDetailScreen`). 세 번째 사용처가 생기면 컴포넌트로 뽑는다.

### 경계의 한계 (알고 쓸 것)
- **경계가 잡은 에러는 프로덕션에서 리포팅되지 않는다.** 개발 중에는 React 가 콘솔에 찍어주지만(테스트에서 `console.error` 를 mock 하는 이유), 리포팅 도구는 아직 프로젝트에 없다. 도입할 땐 `ErrorBoundary` 의 `componentDidCatch` 가 단일 지점이다 — 그전까지 빈 훅을 미리 만들지 않는다.
- 전역 `retry: 1`(`@/lib/queryClient`) 이라 실패가 `fallback` 에 닿기까지 요청이 2번 나간다. 그동안 경계 안쪽은 계속 `pending` 이다.

## 컴포넌트
- 함수형 컴포넌트 + 훅. named export 선호(라우트 파일은 default).
- 새 컴포넌트는 `/new-component`, 새 화면은 `/new-screen`.

## 셋업 상태
- pnpm workspace 미사용 — 루트와 `extension/` 각각 `pnpm install`.
