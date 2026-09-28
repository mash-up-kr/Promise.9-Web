# 폴더 구조 (Folder Structure)

> **기능 기반(feature-based)** 구조다. FSD 아님 — 레이어/import 린터/public API 격식 없음.
> 목적: "어디 둘지" 규칙 하나로 3명 + AI 가 일관되게 만들고 **중복을 막는 것**.
>
> 다만 FSD 의 **엔티티/유스케이스 분리 개념 하나는 빌려 쓴다** (`shared/entities/`). 화면 단위로만 나눴더니
> 여러 화면이 쓰는 서버 계약이 특정 화면 폴더에 갇혀서, 홈이 보관함을 import 하는 식으로 샜기 때문이다.
> 빌린 건 이 한 가지뿐이고 나머지 FSD 격식(레이어 6종·public API·import 린터)은 도입하지 않는다.

## 서비스 맥락
링크 저장 · 분류 · 검색 · 리마인드 서비스. **앱 · 웹 · 익스텐션 세 표면이 같은 도메인(링크)을 공유**한다.
그래서 중복이 가장 터지기 쉬운 곳이 **표면 간 경계** → 공유 코어 `shared/` 로 막는다.

## 4-Zone 레포 구조

```
/                          # Expo 앱+웹 (루트 package.json = Expo)
├─ src/
│   ├─ app/                # expo-router 라우팅 껍데기 (화면은 features에서 import)
│   ├─ features/           # 앱/웹 전용 기능 UI (= 화면·유스케이스 단위)
│   │   ├─ home/           #   홈
│   │   ├─ archive/        #   보관함(폴더 목록·폴더 상세)
│   │   ├─ search/         #   검색
│   │   ├─ link/           #   링크 저장 시트·링크 상세
│   │   ├─ settings/
│   │   └─ auth/
│   ├─ components/ui/      # 앱 전용 공용 UI — expo-*·reanimated·gorhom·expo-router 에 의존하는 것
│   ├─ constants/          # 앱/웹 전역 상수 (라우트 경로 등)
│   ├─ hooks/              # 공용 훅
│   ├─ lib/                # queryClient · dayjs 등 인프라
│   └─ utils/              # 순수 함수 (날짜 포맷 등)
│
├─ shared/                 # ⭐ 순수 TS, 세 표면 공용 (RN/DOM/chrome.* 의존 금지)
│   ├─ types/              #   Link · Folder 등 서버 DTO 기반 타입
│   ├─ api/                #   HTTP 클라이언트 · 에러 서브클래스 · 토큰
│   ├─ entities/           #   데이터 단위 — 서버 계약(쿼리·스키마·errorCode). 화면을 모른다
│   │   ├─ link/           #     GET/POST /links ...
│   │   ├─ folder/         #     GET/POST/PATCH/DELETE /folders ...
│   │   └─ auth/           #     POST /auth/logout · DELETE /auth/withdraw
│   ├─ folder/             #   폴더 색 팔레트 상수 · 이름 규칙(우리가 정한 값)
│   └─ reminder/           #   리마인드 프리셋(우리가 정한 값)
│
├─ packages/
│   └─ ui/                 # ⭐ RN 컴포넌트, 앱·웹·익스텐션 공용 (@promise9/ui). 소스 전용 — 빌드 없음
│       ├─ lib/tv.ts       #   tailwind-variants 설정 (앱은 @/lib/tv 로 재export)
│       ├─ constants/      #   platform.constants
│       └─ <컴포넌트>/     #   text · button · action-button · toggle · icon · wheel-picker ...
│
└─ extension/              # 크롬 익스텐션 (자체 package.json + 자체 번들러)
    └─ src/
        ├─ background/     #   service worker
        ├─ popup/          #   저장 UI
        └─ content/
```

## 💡 결정 규칙 (가장 중요)

새 파일을 만들 때 **순서대로** 판단한다:

1. **세 표면 공유 + 순수 TS(RN/DOM/chrome.* 비의존)?** → `shared/`
   - 예: `Link` 타입, 저장 API 클라이언트, 분류/검색 로직, URL 정규화
2. **서버가 정한 것?** → `shared/entities/<도메인>/`
   - 엔드포인트·응답 스키마·쿼리/뮤테이션·캐시 키·서버 errorCode
   - 판별 질문: *"이 값을 우리가 정했나, 서버가 정했나?"* — 서버면 엔티티다.
3. **기능 무관 공용 UI 인데 import 가 허용 목록 안에서 닫히나?** → `packages/ui/<컴포넌트>/`
   - 허용 목록: `react` · `react-native` · `tailwind-variants` · `nativewind` · `lucide-react-native` · `react-native-svg` · `@tanstack/react-query` · `es-toolkit` + `packages/ui` 내부 파일
   - 하나라도 벗어나면(`expo-*` · `react-native-reanimated` · `@gorhom/*` · `expo-router` …) `src/components/ui/` — 익스텐션(Vite)에서 검증되지 않은 의존이다.
4. **앱/웹 전용?** → 기능 전용은 `src/features/<기능>/`, 여러 기능 공용은 `src/components | hooks | utils`
5. **익스텐션 전용?** → `extension/src/`

> 헷갈리면 **`shared/` 가능성을 먼저** 의심한다. 앱과 익스텐션이 같은 걸 또 만드는 게 1순위 중복 위험.

## shared/ (공유 코어) 규칙
- **순수 TS만.** `react-native` / `expo-*` / DOM API / `chrome.*` import 절대 금지 (그래야 양쪽 번들러가 빌드 가능).
- 의존성 최소화. **컴포넌트(UI)는 여기 두지 않는다** — 공용 UI 는 `packages/ui`.
- **react-query 는 `shared/entities/` 에 한해 허용한다.** 앱·웹·익스텐션이 모두 React + TanStack Query 를
  쓰므로 서버 계약 레이어를 세 번 만들 이유가 없다. `shared/api`·`shared/types`·`shared/folder` 는 계속
  react 무관한 순수 TS 로 둔다.
- alias: `@shared/*` → `./shared/*`

## shared/entities/ (데이터 단위) 규칙

- **서버 계약만 소유한다** — 엔드포인트·zod 응답 스키마·`queryOptions`·mutation·캐시 키·서버 errorCode.
- **화면을 모른다.** 화면용 모델 변환(`select`)·폼 검증·표시 문구는 소비하는 `features/` 것이다.
  같은 캐시를 여러 화면이 서로 다른 `select` 로 뽑아 쓴다.
  ```tsx
  useSuspenseQuery({ ...folderQueries.list(), select: toArchiveFolderData })   // 보관함
  useSuspenseQuery({ ...folderQueries.list(), select: selectFrequentFolders }) // 홈
  ```
- **import 방향은 한 방향** — `src/features` · `extension/src` → `shared/entities` → `shared/api`.
  되짚어 올라가지 않는다. 엔티티는 `src/` 도 `extension/` 도 import 하지 않는다.
- **`features` 끼리 import 하지 않는다.** 다른 화면의 것이 필요하면 그건 십중팔구 엔티티다.
  - 예외: `features/share`(공유 익스텐션 루트)는 라우터 대신 쓰는 두 번째 앱 셸이라 `app/` 처럼 다른 features 를 조합한다. 이 방향(share → 다른 features)만 허용하고, 다른 features 가 share 를 import 하지는 않는다.
- **엔티티끼리는 캐시 키만 참조한다.** (예: 폴더 삭제 후 링크 목록 무효화 →
  `folder` 가 `linkQueries.keys.lists()` 참조). 로직·모델을 가져다 쓰지는 않는다.
- `shared/api` 와의 구분: HTTP 클라이언트·에러 클래스·토큰처럼 **엔드포인트를 모르는** 인프라는 `shared/api`,
  특정 엔드포인트의 스키마·쿼리·캐시 키는 `shared/entities/<도메인>/`.
- 프로덕션 코드는 `react` 자체도 import 하지 않는다(`@tanstack/react-query` · `zod` · `@shared/*` 뿐).
  테스트는 러너가 있는 표면(현재 루트 jest-expo)의 도구를 써도 된다 — 번들에 들어가지 않는다.

## packages/ui/ (공유 UI) 규칙

- **RN 프리미티브 + NativeWind `className`** 으로 쓴다. 앱은 Metro 로, 익스텐션은 Vite + react-native-web 으로 같은 소스를 컴파일한다.
- **`package.json` 에 의존성을 선언하지 않는다**(`dependencies`·`peerDependencies` 모두). 선언하면 pnpm 이 `packages/ui/node_modules` 에 별도 인스턴스를 깔아 nativewind·tailwind-variants 가 둘이 된다(2026-09-21 실측). 루트 `node_modules` 를 위로 걸어 올라가 해석하는 것이 의도된 동작이다 — `shared/` 와 같다.
  - 그 대가로 Biome 이 이 경로의 react·test 도메인을 자동으로 켜지 못한다 → `biome.jsonc` 의 `packages/ui/**` override 가 대신 켠다.
- **내부 import 는 상대경로만.** `@/` 는 소비자마다 가리키는 곳이 달라 익스텐션 tsc 가 깨진다. 앱 `src/` 를 import 하지 않는다.
- **두 tsconfig 를 모두 통과해야 한다.** 익스텐션이 더 엄격하다(`noUncheckedIndexedAccess`). 로컬 확인: `pnpm --filter promise9-extension exec tsc --noEmit`. PR 에서는 `Extension Check` 워크플로가 익스텐션의 테스트·타입 검사·빌드를 돌린다.
- `exports` 필드·`src/` 디렉터리를 만들지 않는다 — `@promise9/ui/<폴더>/<파일>` 이 파일 해석으로 풀려야 Metro 의 `.web.tsx` 플랫폼 확장자가 산다.
- 테스트는 jest-expo + RNTL(루트 `pnpm test` 가 집는다). 익스텐션에서의 렌더는 `extension/src/rnw/ui.test.tsx`.
- 표면 간에 똑같이 보여야 하는 **도메인 표현 컴포넌트**(예: `reminder-card`)도 둔다. 값 모델·정책·포맷은 표면마다 다르므로(앱 `ReminderValue`+dayjs, 익스텐션 `Date`) 컴포넌트는 포맷이 끝난 라벨과 콜백만 받는다.
- `tv` · `platform.constants` 의 정의는 여기 있고, 앱 코드는 기존 경로(`@/lib/tv` · `@/constants/platform.constants`)의 재export 를 그대로 쓴다.

## src/ (앱+웹, Expo/RN)
- `app/` 는 **라우팅 껍데기만**. 화면 로직은 `src/features/<기능>/<Name>Screen.tsx`.
- `src/features/<기능>/` 안: `components/` `hooks/` + 화면. 기능 공용 타입·상수는 `<도메인>.types.ts` · `<도메인>.constants.ts`.
  - 엔티티 쿼리의 화면별 조합(파라미터·`select`)은 **호출부에서 직접** 한다 — 한 화면만 쓰는 얇은 쿼리 팩토리를 만들지 않는다. 반복되는 규칙(파라미터 매핑·선정 정책)은 `<도메인>.utils.ts` 의 순수 함수로 뽑는다.
- 기능 무관 공용 UI 는 `packages/ui/`(이식 가능) 또는 `src/components/ui/`(앱 전용) — 위 결정 규칙 3번.
- alias: `@/*` → `./src/*`

## extension/ (크롬 익스텐션)
- 자체 `package.json` + 번들러(Vite). `shared/`(엔티티 포함)는 `@shared` 로, 공용 UI 는 `@promise9/ui/<폴더>/<파일>` 로 import(react-native-web — 상세: extension.md).
- `background/`(service worker) · `popup/`(저장 UI) · `content/`.
- 앱/웹의 `src/` 는 import 하지 않는다 — 공유가 필요하면 `shared/` 로 올린다.

## 공통 규칙
- **모음 파일은 `<도메인>.<역할>.ts`** — `link.types.ts` · `link.constants.ts` · `link.queries.ts` · `link.contracts.ts`. 전 구역 공통(features·shared 모두): 폴더가 도메인이든 카테고리든 파일명만으로 도메인+역할이 읽히게 한다 (에디터 탭·검색에서 `types.ts` 5개가 열려도 구분되도록).
  - **co-locate 우선**: 한 파일에서만 쓰는 타입·상수·컴포넌트 Props 는 그 파일 안에 둔다. 모음 파일은 여러 파일이 공유할 때만 만든다.
  - API 요청/응답 타입은 `<도메인>.contracts.ts` 의 `z.infer` 가 단일 출처 — `*.types.ts` 에 중복 정의하지 않는다.
- import 는 절대경로 `@/`(앱/웹) · `@shared/`(공유 코어) · `@promise9/ui/`(공유 UI). 상대경로는 **같은 기능 폴더 내부**에서만 — 예외: `packages/ui` 내부는 폴더 간에도 상대경로만 쓴다(위 packages/ui 규칙).
- 플랫폼 분기: 같은 폴더에 `Button.tsx` / `Button.web.tsx` co-location. (리마인드 발송처럼 표면별로 다른 로직)
- **빈 폴더 미리 만들지 않기** — 필요할 때 생성.
- `index.ts` public API 는 선택(편하면 사용, 강제 아님).
- 새로 만들기 전 `/check-dup` 으로 위 결정 규칙 따라 기존 코드부터 검색.

## ⚠️ 셋업 (shared/ 사용 전 1회)
- `tsconfig.json` 에 `@shared/*` → `./shared/*` path 추가. (Expo 는 tsconfig paths 지원)
- 익스텐션 번들러에 `@shared` → `../shared` alias + tsconfig paths.
