# 크롬 익스텐션 컨벤션 (Manifest V3)

> 위치: `extension/` (자체 `package.json`, 자체 빌드).
> **여기서는 Expo / React Native / NativeWind 를 쓰지 않는다.** 공통 규칙은 shared.md.

## 스택
- React 19 + **Vite** + `@crxjs/vite-plugin` + **Tailwind v4** (plain DOM).
- 테스트는 **vitest + @testing-library/react** — 루트의 jest-expo 와 분리한다(러너가 다르다).
- 디자인 토큰은 앱·웹과 같은 파일(`shared/styles/tokens.css`)을 import 한다. 값을 다시 정의하지 않는다.

## 기본
- Manifest V3. `permissions` 는 최소한으로 — 아이콘 클릭으로만 열리므로 상시 `tabs` 대신 `activeTab` 을 쓴다.
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

## extension/CLAUDE.md
`extension/CLAUDE.md` 가 `@../docs/conventions/extension.md` 를 import 하므로, 익스텐션 폴더에서
작업할 때만 이 규칙이 컨텍스트에 들어온다. 영역 전용 메모(alias 대상 등)도 그 파일에 둔다.
