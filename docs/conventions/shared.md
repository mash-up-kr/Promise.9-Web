# 공통 컨벤션 (전 영역 적용)

앱/웹/익스텐션 어디서나 지킨다. (AGENTS.md 에서 항상 import 됨)

## TypeScript
- `strict: true`. `any` 금지 — 불가피하면 `unknown` + 좁히기.
- 컴포넌트 props·외부 노출 함수는 타입 명시. 내부 지역 변수는 추론 활용.
- **객체 형태(컴포넌트 Props 등)는 `interface`**, `type` 이어야만 하는 것(유니온·유틸리티 조합·별칭·조건부 타입)만 `type`.
  - 근거: TS 공식 핸드북의 휴리스틱 — *"use `interface` until you need to use features from `type`"*. 공식 성능 위키도 교집합(`&`) 대신 interface `extends` 를 권장한다 (타입 관계 캐시, 속성 충돌 감지, 에러 메시지에 원본 이름 유지).
  - 참고: [Handbook — Type Aliases vs Interfaces](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#differences-between-type-aliases-and-interfaces) · [Wiki — Preferring Interfaces Over Intersections](https://github.com/microsoft/TypeScript/wiki/Performance#preferring-interfaces-over-intersections)

## 네이밍
- 컴포넌트 파일/이름: PascalCase (`LinkCard.tsx`).
- 훅: `useXxx`. 일반 함수/변수: camelCase. 상수: `UPPER_SNAKE_CASE`.
- 불리언: `is` / `has` / `should` 접두사.
- 폴더: 도메인명 소문자 또는 kebab-case.

## import
- 절대경로 `@/`(앱/웹) · `@shared/`(공유 코어) 사용. 상대경로는 같은 기능 폴더 내부에서만.
- 그룹 순서: ① 외부 라이브러리 → ② `@shared/` → ③ `@/` → ④ 상대경로.
- 저장 시 VSCode `organizeImports` 가 자동 정렬한다(.vscode/settings.json).

## 에러 / 비동기
- async 는 try/catch 또는 react-query 의 에러 상태로 다룬다. **빈 catch 금지**.
- 사용자에게 보이는 메시지와 개발 로깅을 구분한다.

## 주석
- "왜"를 적는다. "무엇"은 코드로 드러나게 한다.
- 주변 코드의 주석 밀도·언어를 따른다. 불필요한 주석 금지.

## Lint · Format

- **Biome 단일 도구**로 lint + format + import 정리. ESLint/Prettier 사용하지 않는다.
- `pnpm check` — 검증만 (CI/리뷰 전).
- `pnpm check:fix` — 자동 수정 + 포맷.
- 설정·룰셋: `biome.jsonc` 참고.

## 금지
- `console.log` 커밋 금지(디버깅 후 제거).
- 주석처리된 죽은 코드 커밋 금지.
- 동일 기능 중복 구현 금지 — 먼저 검색(`/check-dup`).
