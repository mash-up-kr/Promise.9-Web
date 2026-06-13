# Promise9 — 프로젝트 컨텍스트

> 이 파일은 항상 로드됩니다 — **프로젝트 사실 정보**만 둡니다.
> 행동 규칙(어떻게 일할지)은 `.claude/rules/core-rules.md` 에 분리되어 있습니다.

## 프로젝트 개요

- 단일 레포에서 **앱 + 웹**을 한 코드베이스로 개발 (Expo 56 / React Native / RN Web).
- **크롬 익스텐션**은 `extension/` 하위 폴더 + 자체 `package.json` 으로 별도 빌드.
- 언어 TypeScript(strict) · 스타일 NativeWind · 패키지매니저 **pnpm**.

## Expo 56 주의

Expo 는 메이저 변경이 잦다. **앱/웹 코드 작성 전** 반드시 버전 문서 확인:
https://docs.expo.dev/versions/v56.0.0/

## 규칙 / 컨벤션

- 행동 규칙(항상 로드): @.claude/rules/core-rules.md
- 공통 코드 컨벤션(항상 로드): @docs/conventions/shared.md
- 앱·웹 상세: docs/conventions/app-web.md
- 크롬 익스텐션 상세: docs/conventions/extension.md
- 폴더 구조(기능 기반 + 공유 코어): docs/conventions/structure.md

## Skills

- `/check-dup` — 새 코드 작성 전 중복 탐지 (가장 자주 씀)
- `/new-component` — NativeWind 컴포넌트 스캐폴드
- `/new-screen` — expo-router 화면 추가
- `good-code` — 코드 작성/리뷰 시 품질 4원칙 (자동 트리거)
- `good-debug` — 버그/에러 대응 시 디버깅 절차 (자동 트리거)
- `/commit` — 관심사별 atomic 커밋
- `/pr` — 템플릿 기반 PR 생성
