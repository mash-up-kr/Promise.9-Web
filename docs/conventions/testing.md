# 테스트 컨벤션 (Unit · Integration)

> TDD 로 개발한다 — **코드보다 테스트를 먼저 쓴다**(red → green → refactor). 행동 규칙은 core-rules.md.
> 이 문서의 주 내용은 **unit · integration**. E2E 는 **웹=Playwright · 네이티브=Maestro** 로 분리 — 맨 아래 "E2E" 섹션 참고.

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

---

# E2E (웹 · 네이티브)

> unit·integration 과 **별개**. 표면(surface)별로 도구가 다르다. jest 와 섞이지 않는다.

| 표면 | 도구 | 실행 | CI | 위치 |
|------|------|------|------|------|
| 웹 (RN Web) | **Playwright** | `pnpm test:e2e` (UI 모드 `pnpm test:e2e:ui`) | ✅ GitHub Actions (`web-e2e.yml`) | `e2e/*.spec.ts` · `playwright.config.ts` |
| 네이티브 (iOS·Android) | **Maestro** | `pnpm test:e2e:app` | ❌ CI 제외 → **PR 전 로컬 1회** | `.maestro/*.yaml` |

## 네이티브 E2E 는 CI 에서 돌리지 않는다 (PR 전 로컬 실행)
네이티브 앱 빌드는 GitHub Actions 에서 너무 오래 걸려 **앱 E2E CI 는 제거**했다. 대신 PR 올리기 전 **로컬에서 iOS·Android 둘 다 1회 통과**시키는 것을 컨벤션으로 한다.
- 절차·사전요건(시뮬레이터/에뮬레이터 + Metro)은 **`.maestro/README.md`** 단일 출처.
- 웹 E2E(Playwright)는 그대로 CI 에서 자동 검증된다.
- 대안으로 **EAS Workflows 의 Maestro 잡**(클라우드 에뮬/시뮬 실행, https://docs.expo.dev/eas/workflows/examples/e2e-tests/)이 있으나 빌드 크레딧 비용이 들어 보류 — 플로우가 쌓여 로컬 게이트가 부담되면 재검토 (2026-07 검토).

## 도구 선택 근거
- **웹 = Playwright**: RN Web 은 실제 DOM 으로 렌더되므로 일반 브라우저 E2E 가 가능. 정식(GA) 도구로 크로스브라우저·로케일·뷰포트를 지원.
- **네이티브 = Maestro**: Expo 공식 권장 도구. iOS/Android 네이티브 앱을 YAML 플로우로 검증.
- **웹에 Maestro 를 쓰지 않는 이유**: Maestro 웹 지원은 Beta + Chromium 전용 + 로케일(en-US)/뷰포트 고정이라 한국어·반응형·크로스브라우저 검증 불가. Expo 공식 Maestro 가이드도 네이티브 전용이고 웹은 다루지 않음.

## 셀렉터 (웹/네이티브 공통 원칙)
unit·integration(RNTL)과 동일하게 **접근성·사용자 관점 우선**. testID 남발 금지.
- RN `accessibilityRole` → 웹에서 ARIA role(`getByRole`), 네이티브에서 role 로 매핑.
- RN `testID` → 웹에서 `data-testid`(Playwright `getByTestId`), 네이티브에서 `id`. 최후의 수단.

## 실행 사전요건
- 웹: 별도 준비 없음. `playwright.config.ts` 의 webServer 가 `pnpm web`(expo) 를 자동 기동·대기.
- 네이티브: **dev build 설치된 시뮬레이터/에뮬레이터 + Metro 실행** 필요. 사전요건(Maestro CLI·Java 17·dev build)과 주의사항은 **`.maestro/README.md`** 단일 출처.

## jest 와의 분리
Playwright 스펙은 `e2e/` 에 두고, jest 는 `jest.config.js` 의 `testPathIgnorePatterns` 로 `/e2e/` 를 제외한다(`*.test.*` = jest, `e2e/*.spec.ts` = Playwright).

## agent 탐색 검증과의 관계 (검증 사다리)
개발 중 agent 가 브라우저/디바이스를 직접 조작해 동작을 확인하는 것(웹: Chrome DevTools·Playwright MCP / 네이티브: agent-device)은 **탐색적 검증**이며, E2E 테스트가 아니다 — 스크립트로 버전 관리되지 않고, 반복 가능하지 않고, 게이트로 실행되지 않는다. 둘은 대체가 아니라 역할 분담이다:

| 층 | 도구 | 시점 | 성격 |
|---|---|---|---|
| unit·integration | jest | TDD 루프 | 회귀 자산 |
| agent 탐색 검증 | MCP (브라우저·디바이스) | 변경 직후 "지금 동작하는가" | 일회성 확인 |
| 웹 E2E | Playwright | CI, "여전히 동작하는가" | 회귀 자산 |
| 네이티브 E2E | Maestro | PR 전 로컬 | 회귀 자산 |

**승격 기준** — agent 로 확인하던 플로우는 다음 중 하나에 해당하면 스크립트 E2E 로 승격한다:
1. **크리티컬 유저 저니가 완성됐을 때** (로그인, 링크 저장 등) — 즉시 승격.
2. **같은 플로우를 agent 로 반복 확인하게 될 때** — 반복되는 수동 확인은 스크립트화 신호.

승격 시 agent 가 탐색한 그 세션에서 Playwright spec / Maestro flow 초안을 바로 작성하는 것이 처음부터 스펙을 상상해서 쓰는 것보다 정확하다 (record → refine).
