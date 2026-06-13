# 크롬 익스텐션 컨벤션 (Manifest V3)

> 위치: `extension/` (자체 `package.json`, 자체 빌드). 폴더 미생성이면 생성 시 적용.
> **여기서는 Expo / React Native / NativeWind 를 쓰지 않는다.** 공통 규칙은 shared.md.

## 기본
- Manifest V3. `manifest.json` 의 `permissions` 는 최소한으로.
- 빌드/설치 명령은 반드시 `extension/` 안에서: `cd extension && pnpm ...`.

## 구조 (MV3)
- background = service worker (영구 상태 없음, 이벤트 기반).
- content script ↔ background ↔ popup 통신은 메시지 패싱(`chrome.runtime.sendMessage`).
- 메시지 타입은 한 곳에 정의해 공유. 문자열 리터럴을 여기저기 흩뿌리지 않는다.

## 앱/웹과의 공유
- 공유 가능한 순수 로직(Link 타입·저장 API·분류/검색)은 중복 구현 말고 **루트 `shared/` (`@shared`)** 를 재사용/추가 (`/check-dup`).
- `chrome.*` API 는 익스텐션 영역에서만. `shared/` 와 앱/웹 코드로 새어나가지 않게.
- `shared/` 는 순수 TS 전용 — `chrome.*` 의존 코드를 여기 넣지 않는다.

## (권장) extension/CLAUDE.md
extension 폴더 작업 시에만 로드되도록 `extension/CLAUDE.md` 에
`@../docs/conventions/extension.md` 한 줄 + 영역 메모를 두면, 익스텐션 작업 중에만
이 규칙이 컨텍스트에 들어온다.
