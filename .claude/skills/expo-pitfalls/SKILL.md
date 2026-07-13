---
name: expo-pitfalls
description: 이 프로젝트 고유의 Expo·NativeWind·RN 함정과 패키지 도입 기준 (자동 트리거). Use when writing/modifying app-web UI code, when a style works on web but not native (or vice versa), when adding a new package, or when upgrading expo/nativewind/react-native-css. 일반 Expo API 사용법은 expo 공식 플러그인 skill 을 쓴다. 익스텐션 코드에는 해당 없다.
---

# expo-pitfalls — 프로젝트 고유 함정 (앱/웹)

일반 문서에 없는, 이 레포에서 실측·디버깅으로 확인된 사실만 모은다. 일반 규칙은 docs/conventions/app-web.md.

## 1. 새 패키지 도입 기준
새 기능에 패키지가 필요하면 **탐색 순서**를 지킨다:
1. **Expo SDK 내장 모듈(`expo-*`) 우선** — https://docs.expo.dev/versions/v56.0.0/ 에서 먼저 찾는다. SDK 버전과 함께 관리되어 업그레이드 리스크가 가장 작다.
2. 없으면 **서드파티** — 도입 전에 다음을 확인한다:
   - Expo 지원 여부 (config plugin 제공 또는 JS-only)
   - New Architecture 호환 (RN 0.85 는 New Architecture 기본)
   - **RN Web 호환** — 이 프로젝트는 앱+웹 단일 코드베이스라 웹에서 깨지는 패키지는 못 쓴다
   - 유지보수 상태 (최근 릴리즈·이슈 대응) — https://reactnative.directory 에서 한눈에 비교 가능
3. 네이티브 코드가 딸린 패키지(config plugin·prebuild 필요)는 development build 영향이 있으므로 **도입 전에 사용자에게 확인**한다 — 라이브러리 선택은 설계 갈림길이다 (core-rules "Think Before Coding").

## 2. NativeWind v5 (preview) — v4 와 다르다
- v5 는 런타임 `cssInterop()`/`remapProps()` 를 **제거**했다. babel transform 이 모든 컴포넌트의 className 을 자동 처리하므로 수동 등록 금지.
- v5 는 CSS cascade 를 충실히 재현한다 → **inline `style` prop 이 className 을 이긴다.**

## 3. inline style 이 className 을 누르는 컴포넌트
`@expo/html-elements` 의 `H1~H6` 처럼 내부에서 `style={[styles.x, props.style]}` 로 기본값을 주입하는 컴포넌트는 **네이티브에서 className 이 무력화**된다 (웹은 RNW 가 class vs class 경합으로 만들어 className 이 이김 → 같은 코드가 플랫폼별로 다르게 렌더).
- **해법**: `styled(컴포넌트, { className: 'style' })` 로 className 을 style prop 슬롯에 매핑 — 내부 배열 마지막에 들어가 정당하게 덮는다. `!important` 불필요. 적용례: `src/components/ui/heading/Heading.tsx`.
- 내장 기본값(예: bold)을 끄려면 그 속성을 **명시적으로 출력**해야 한다 — tv base 에 두지 말고 variant 로 (`bold: { true: 'font-bold', false: 'font-normal' }`).

## 4. rem = 16 고정 (metro + patch 세트)
- 네이티브는 rem 을 컴파일 타임 px 로 인라인하며 기본 배수가 14 → 웹(16)과 어긋난다. `metro.config.js` 의 `inlineRem: 16` + `patches/react-native-css.patch` (옵션이 무시되는 업스트림 버그 1줄 수정) 세트로 고정 중.
- **react-native-css 업그레이드 시 patch 가 여전히 필요한지 반드시 확인.** 안 하면 조용히 rem14 로 회귀한다 — 버튼·패딩이 미세하게 작아지는 증상(40px → 35pt).

## 5. jest 는 className 을 해석하지 않는다
jest-expo 환경에는 className→style 해석기가 없다. className 스타일은 jest 렌더로 검증 불가 → tv 매핑 함수(예: `headingStyles`)를 export 해 **클래스 문자열을 직접 단언**하고, 실제 적용은 device/web 으로 확인한다 (`/new-test` 참조).

## 6. 플랫폼 variant 는 발췌해서 쓴다
`ios:`/`android:`/`native:`/`web:` variant 는 `src/global.css` 에 `@custom-variant` 로 발췌돼 있다. **`nativewind/theme.css` 전체 import 금지** — 미설치 의존성(tailwindcss-safe-area 등)이 딸려온다. 새 variant 가 필요하면 같은 방식으로 발췌 추가.

## 7. className 으로 안 되는 스타일은 prop/래퍼로
- `TextInput` 의 placeholder·커서·선택 색은 RN 특성상 prop 전용 (`placeholderTextColor` 등) — 토큰 hex 를 상수로 두고 prop 지정. 적용례: `src/components/ui/input/Input.tsx`.
- svg 아이콘(lucide 포함) 색은 `src/components/ui/icon/Icon.tsx` 래퍼로만 — className→color 매핑 + WeakMap 캐시가 들어 있다. 아이콘을 직접 styled 로 재래핑하지 않는다 (매 렌더 재생성 → native 크래시 이력).

## 업그레이드 체크리스트 (expo / nativewind / react-native-css)
1. https://docs.expo.dev/versions/ 에서 대상 버전 breaking change 확인.
2. `patches/react-native-css.patch` 적용 가능 여부 확인 (§4).
3. Heading·Icon 의 styled 매핑이 여전히 동작하는지 device 로 확인 (§3·§7).
4. `pnpm test` + 주요 화면 웹/네이티브 육안 대조.
