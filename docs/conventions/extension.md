# 크롬 익스텐션 컨벤션 (Manifest V3)

> 위치: `extension/` (자체 `package.json`, 자체 빌드).
> **익스텐션 고유 UI 는 plain DOM + Tailwind 로 쓴다. 앱과 공유하는 컴포넌트만 `@promise9/ui`(react-native-web)로 가져온다 — Expo API 는 쓰지 않는다.** 공통 규칙은 shared.md.

## 스택
- React 19 + **Vite** + `@crxjs/vite-plugin` + **Tailwind v4**. 고유 UI 는 plain DOM, 공유 컴포넌트는 react-native-web.
- 테스트는 **vitest + @testing-library/react** — 루트의 jest-expo 와 분리한다(러너가 다르다).
- E2E 는 **Playwright**(`extension/e2e`, `pnpm test:e2e`) — 빌드한 확장을 실제로 설치해 패널·background 를 돌리고 서버만 목으로 둔다. 상세: `extension/README.md`.
- 디자인 토큰은 앱·웹과 같은 파일(`shared/styles/tokens.css`)을 import 한다. 값을 다시 정의하지 않는다.

## 기본
- Manifest V3. `permissions` 는 최소한으로. 다만 **사이드패널은 `tabs` 가 필요하다** — 패널이 열린 채
  사용자가 탭을 옮겨다녀도 저장 대상이 따라가야 하는데, 아이콘 클릭 시점의 한 탭에만 부여되는
  `activeTab` 으로는 탭 전환을 따라갈 수 없다(근거: `extension/manifest.config.ts`).
- 빌드/설치 명령은 반드시 `extension/` 안에서: `cd extension && pnpm ...` (또는 `pnpm --filter promise9-extension ...`).
- 로컬 확인 방법(탭에서 UI 만 / 실제 확장 설치)은 `extension/README.md`.

## 구조 (MV3)
- background = service worker (영구 상태 없음, 이벤트 기반).
- content script ↔ background ↔ popup 통신은 메시지 패싱(`chrome.runtime.sendMessage`).
- 메시지 타입은 한 곳에 정의해 공유. 문자열 리터럴을 여기저기 흩뿌리지 않는다.

## 앱/웹과의 공유
- 공유 가능한 로직(Link 타입·저장 API·서버 계약 쿼리·폴더 팔레트)은 중복 구현 말고 **루트 `shared/` (`@shared`)** 를 재사용/추가 (`/check-dup`).
- 서버 계약(엔드포인트·스키마·errorCode·쿼리)은 `shared/entities/` 에 있다 — 익스텐션도 그대로 쓴다.
- 앱/웹의 `src/` 는 import 하지 않는다. 공유가 필요하면 `shared/` 로 올린다.
- `chrome.*` API 는 익스텐션 영역에서만. `shared/` 와 앱/웹 코드로 새어나가지 않게.
- `shared/` 는 순수 TS 전용 — `chrome.*` 의존 코드를 여기 넣지 않는다.
- 공용 UI 는 `@promise9/ui/<폴더>/<파일>` 로 import 한다. 디자이너가 **앱과 같은 컴포넌트**라고 확인한 것만 도입한다 — 시안이 다르면 DOM 으로 따로 둔다.
- `react-native` 해석은 세 파이프라인에 따로 걸려 있다(`vite.rnw.ts` 플러그인 · vitest `server.deps.inline` · `optimizeDeps` 플러그인). NativeWind·react-native-css·Vite 를 올리면 셋 다 다시 확인한다: `pnpm test` · `pnpm build` · `pnpm dev`.
- `global.css` 의 Tailwind import 를 `@import "tailwindcss"` 한 줄로 되돌리지 않는다 — 유틸리티가 레이어에 들어가 react-native-web 기본 스타일에 전부 진다.
- 렌더링 스택 버전은 루트 `package.json` 과 같아야 한다(`src/rnw/deps.test.ts` 가 강제).

## extension/CLAUDE.md
`extension/CLAUDE.md` 가 `@../docs/conventions/extension.md` 를 import 하므로, 익스텐션 폴더에서
작업할 때만 이 규칙이 컨텍스트에 들어온다. 영역 전용 메모(alias 대상 등)도 그 파일에 둔다.
