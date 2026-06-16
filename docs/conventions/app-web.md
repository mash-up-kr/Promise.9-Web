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

## 컴포넌트
- 함수형 컴포넌트 + 훅. named export 선호(라우트 파일은 default).
- 새 컴포넌트는 `/new-component`, 새 화면은 `/new-screen`.

## 셋업 상태
- pnpm workspace 미사용 — 루트와 `extension/` 각각 `pnpm install`.
